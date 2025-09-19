import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// shadcn ui
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "../components/ui/form";

const BASE_URL = import.meta.env.VITE_API_URL;
const LOGIN_URL = `${BASE_URL}/api/login`;
const REGISTER_URL = `${BASE_URL}/api/user`;

// Schemas
const LoginSchema = z.object({
  email: z.string().email("Email invalide"),
});
type LoginValues = z.infer<typeof LoginSchema>;

const RegisterSchema = z.object({
  pseudo: z.string().min(2, "Pseudo trop court"),
  email: z.string().email("Email invalide"),
});
type RegisterValues = z.infer<typeof RegisterSchema>;

type UserResponse = {
  id: string;
  pseudo: string;
  email: string;
  [k: string]: unknown;
};

export default function AuthenticationPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "" },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { pseudo: "", email: "" },
  });

  const switchMode = (next: "login" | "register") => {
    setMode(next);
    setLoginError(null);
    setRegisterError(null);
    if (next === "login") loginForm.reset({ email: "" });
    else registerForm.reset({ pseudo: "", email: "" });
  };

  // Handlers
  const handleLogin = async (values: LoginValues) => {
    setLoading(true);
    setLoginError(null);
    try {
      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email.trim() }),
      });

      if (!res.ok) {
        const text = await res.text();
        if (res.status === 404) throw new Error("Utilisateur non trouvé");
        throw new Error(text || `Erreur ${res.status}`);
      }

      const data = (await res.json()) as UserResponse;
      localStorage.setItem("user", JSON.stringify(data));
      navigate("/vote");
    } catch (e: any) {
      setLoginError(String(e.message || "Erreur connexion"));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: RegisterValues) => {
    setLoading(true);
    setRegisterError(null);
    try {
      const res = await fetch(REGISTER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pseudo: values.pseudo.trim(),
          email: values.email.trim(),
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        if (res.status === 409) throw new Error("Utilisateur déjà existant");
        throw new Error(text || `Erreur ${res.status}`);
      }

      const data = (await res.json()) as UserResponse;
      localStorage.setItem("user", JSON.stringify(data));
      navigate("/vote");
    } catch (e: any) {
      setRegisterError(String(e.message || "Erreur inscription"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <Card className="w-full max-w-md shadow-md rounded-xl">
        <CardHeader className="text-center pb-0">
          <CardTitle className="text-2xl font-bold">
            {mode === "login" ? "Connexion" : "Inscription"}
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            {mode === "login"
              ? "Connecte-toi avec ton email"
              : "Crée un compte avec ton pseudo et ton email"}
          </p>
        </CardHeader>

        <CardContent className="p-6">
          {mode === "login" ? (
            <Form key="login-form" {...loginForm}>
              <form
                onSubmit={loginForm.handleSubmit(handleLogin)}
                className="space-y-4"
              >
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          id="login-email"
                          key="login-email"
                          type="email"
                          autoComplete="email"
                          placeholder="toto@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {loginError && (
                  <p className="text-sm text-red-600">{loginError}</p>
                )}
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Connexion..." : "Se connecter"}
                </Button>
              </form>
            </Form>
          ) : (
            <Form key="register-form" {...registerForm}>
              <form
                onSubmit={registerForm.handleSubmit(handleRegister)}
                className="space-y-4"
              >
                <FormField
                  control={registerForm.control}
                  name="pseudo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pseudo</FormLabel>
                      <FormControl>
                        <Input
                          id="register-pseudo"
                          key="register-pseudo"
                          type="text"
                          autoComplete="off"
                          placeholder="Ton pseudo"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          id="register-email"
                          key="register-email"
                          type="email"
                          autoComplete="email"
                          placeholder="toto@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {registerError && (
                  <p className="text-sm text-red-600">{registerError}</p>
                )}
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Inscription..." : "S’inscrire"}
                </Button>
              </form>
            </Form>
          )}

          {/* Toggle Connexion / Inscription */}
          <div className="mt-4 text-center border-t pt-4">
            {mode === "login" ? (
              <p className="text-sm">
                Pas encore de compte ?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="text-blue-600 hover:underline"
                >
                  S’inscrire
                </button>
              </p>
            ) : (
              <p className="text-sm">
                Tu as déjà un compte ?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-blue-600 hover:underline"
                >
                  Se connecter
                </button>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
