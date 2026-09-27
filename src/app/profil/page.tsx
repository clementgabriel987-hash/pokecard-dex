"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // États du formulaire classique
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // États pour la gestion du compte (Définir mot de passe / Délier)
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [securityMessage, setSecurityMessage] = useState("");
  const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);

  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    }
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // --- ACTIONS D'AUTHENTIFICATION ---

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError("");
    setAuthMessage("");

    if (isLoginMode) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // Ajout d'un rappel pour l'email non vérifié dans le message d'erreur
        if (error.message.includes("Invalid login credentials")) {
          setAuthError("Erreur : Identifiants incorrects. (Avez-vous bien validé l'email de confirmation envoyé lors de votre inscription ?)");
        } else if (error.message.includes("Email not confirmed")) {
          setAuthError("Erreur : Vous devez valider votre adresse email avant de pouvoir vous connecter. Vérifiez vos spams !");
        } else {
          setAuthError(`Erreur : ${error.message}`);
        }
      } else {
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setAuthError(error.message);
      } else {
        // NOUVEAU MESSAGE D'INSCRIPTION RÉUSSIE
        setAuthMessage("✨ Inscription réussie ! Un lien de confirmation a été envoyé à votre adresse email. Veuillez cliquer dessus pour activer votre compte avant de vous connecter.");
        setIsLoginMode(true);
        setPassword("");
      }
    }
    setIsAuthenticating(false);
  };

  const handleGoogleLogin = async () => {
    setAuthError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/profil`,
      },
    });
    if (error) setAuthError(error.message);
  };

  // --- GESTION DU COMPTE ET DES IDENTITÉS ---

  const googleIdentity = user?.identities?.find((id: any) => id.provider === "google");
  const emailIdentity = user?.identities?.find((id: any) => id.provider === "email");

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingSecurity(true);
    setSecurityMessage("");
    
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      setSecurityMessage(`❌ Erreur: ${error.message}`);
    } else {
      setSecurityMessage("✅ Mot de passe configuré avec succès ! Vous pouvez maintenant vous connecter par email.");
      setNewPassword("");
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    }
    setIsUpdatingSecurity(false);
  };

  const handleUnlinkGoogle = async () => {
    if (!googleIdentity) return;
    
    if (!emailIdentity && !securityMessage.includes("✅")) {
      alert("Veuillez d'abord configurer un mot de passe ci-dessus avant de délier votre compte Google, sinon vous perdrez l'accès à votre compte !");
      return;
    }

    setIsUpdatingSecurity(true);
    const { error } = await supabase.auth.unlinkIdentity(googleIdentity.identity_id);
    
    if (error) {
      setSecurityMessage(`❌ Impossible de délier Google : ${error.message}`);
    } else {
      setSecurityMessage("✅ Compte Google délié avec succès !");
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    }
    setIsUpdatingSecurity(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090B] text-white font-['Outfit'] flex flex-col items-center pt-20 px-6 pb-20">
      <div className="w-full max-w-3xl flex flex-col gap-8 animate-fade-in">
        
        {/* Navigation retour */}
        <Link href="/" className="flex items-center gap-3 text-zinc-400 hover:text-white transition group w-fit">
          <div className="w-10 h-10 bg-[#18181B] border border-white/10 rounded-full flex items-center justify-center group-hover:bg-white/5 transition">
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
          </div>
          <span className="font-medium text-lg">Retour au Pokédex</span>
        </Link>

        {/* Bloc Profil Principal */}
        <div className="bg-[#18181B] border border-white/10 rounded-[32px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 rounded-full bg-[#09090B] border-4 border-rose-500/30 flex items-center justify-center text-4xl md:text-5xl shadow-[0_0_30px_rgba(244,63,94,0.2)] overflow-hidden">
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                "👤"
              )}
            </div>

            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left w-full">
              
              {user ? (
                // --- VUE UTILISATEUR CONNECTÉ ---
                <div className="w-full">
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Mon Profil</h1>
                  <p className="text-xl text-rose-400 font-medium mb-1">{user.email}</p>
                  <p className="text-zinc-500 text-sm mb-8">Membre certifié du Pokédex</p>
                  
                  <div className="w-full bg-[#09090B] border border-white/10 rounded-2xl p-6 mb-8">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <span>🛡️</span> Sécurité & Connexions
                    </h3>

                    {/* Définir un mot de passe avec le bouton 👁️ */}
                    <form onSubmit={handleSetPassword} className="flex flex-col gap-3 mb-6 pb-6 border-b border-white/10">
                      <label className="text-sm text-zinc-400">Configurer un mot de passe (pour se connecter avec l'email)</label>
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <input 
                            type={showNewPassword ? "text" : "password"} 
                            placeholder="Nouveau mot de passe..." 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full bg-[#18181B] border border-white/10 rounded-xl px-4 py-2 pr-12 text-white outline-none focus:border-rose-500 transition-colors"
                          />
                          <button 
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition"
                          >
                            {showNewPassword ? "🙈" : "👁️"}
                          </button>
                        </div>
                        <button 
                          type="submit" 
                          disabled={isUpdatingSecurity || !newPassword}
                          className="bg-white text-black hover:bg-zinc-200 disabled:opacity-50 px-6 py-2 rounded-xl font-medium transition shrink-0"
                        >
                          Valider
                        </button>
                      </div>
                    </form>

                    {/* Gestion des comptes liés */}
                    <div className="flex flex-col gap-3">
                      <span className="text-sm text-zinc-400">Comptes liés :</span>
                      
                      {googleIdentity ? (
                        <div className="flex items-center justify-between bg-[#18181B] border border-white/10 p-3 rounded-xl">
                          <div className="flex items-center gap-3">
                            <span className="bg-white p-1 rounded-full w-6 h-6 flex items-center justify-center">
                              <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                            </span>
                            <span className="text-white font-medium">Google</span>
                          </div>
                          
                          {emailIdentity ? (
                            <button 
                              onClick={handleUnlinkGoogle}
                              disabled={isUpdatingSecurity}
                              className="text-red-400 hover:text-red-300 text-sm font-medium transition disabled:opacity-50"
                            >
                              Délier
                            </button>
                          ) : (
                            <span className="text-zinc-500 text-xs italic">
                              (Identité principale)
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-zinc-500 text-sm">Aucun compte Google lié.</p>
                      )}
                    </div>
                    
                    {securityMessage && (
                      <div className="mt-4 p-3 bg-[#18181B] border border-white/10 rounded-lg text-sm">
                        {securityMessage}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <button onClick={handleLogout} className="bg-[#09090B] hover:bg-white/5 border border-white/10 text-rose-500 px-8 py-3 rounded-full font-medium transition">
                      Se déconnecter
                    </button>
                  </div>
                </div>
              ) : (
                // --- VUE NON CONNECTÉ : FORMULAIRE ---
                <div className="w-full max-w-md mx-auto md:mx-0 bg-[#09090B] p-6 rounded-2xl border border-white/10">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {isLoginMode ? "Te revoilà ! 👋" : "Rejoins-nous ! 🚀"}
                  </h2>
                  <p className="text-zinc-400 text-sm mb-6">
                    Connecte-toi pour sauvegarder ta collection sur le Cloud.
                  </p>

                  <button 
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 bg-white text-black hover:bg-zinc-200 rounded-xl px-4 py-3 font-medium transition mb-6"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Continuer avec Google
                  </button>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-px bg-white/10 flex-1"></div>
                    <span className="text-zinc-600 text-sm">OU</span>
                    <div className="h-px bg-white/10 flex-1"></div>
                  </div>

                  <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
                    <input 
                      type="email" 
                      placeholder="Adresse Email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-[#18181B] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-rose-500 transition-colors"
                    />
                    
                    {/* Champ mot de passe avec le bouton 👁️ */}
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Mot de passe" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="w-full bg-[#18181B] border border-white/10 rounded-xl px-4 py-3 pr-12 text-white outline-none focus:border-rose-500 transition-colors"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition"
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>

                    {authError && <p className="text-red-400 text-sm font-medium text-center">{authError}</p>}
                    {authMessage && <p className="text-green-400 text-sm font-medium text-center">{authMessage}</p>}

                    <button 
                      type="submit" 
                      disabled={isAuthenticating}
                      className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-500/50 text-white rounded-xl px-4 py-3 font-medium transition shadow-[0_0_15px_rgba(244,63,94,0.3)] mt-2"
                    >
                      {isAuthenticating 
                        ? "Chargement..." 
                        : (isLoginMode ? "Se connecter" : "S'inscrire avec un email")}
                    </button>
                  </form>

                  <div className="mt-6 text-center border-t border-white/10 pt-4">
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsLoginMode(!isLoginMode);
                        setAuthError("");
                        setAuthMessage("");
                      }}
                      className="text-zinc-500 hover:text-white text-sm transition-colors"
                    >
                      {isLoginMode 
                        ? "Pas encore de compte ? S'inscrire" 
                        : "Déjà un compte ? Se connecter"}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </main>
  );
}