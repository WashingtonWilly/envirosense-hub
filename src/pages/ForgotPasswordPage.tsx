import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import guardchicksLogo from '@/assets/guardchicks-logo.png';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        setError('No existe una cuenta con ese correo.');
      } else if (code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Intenta más tarde.');
      } else if (code === 'auth/invalid-email') {
        setError('Correo electrónico inválido.');
      } else {
        setError('Error al enviar el correo. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-card shadow-lg border border-border overflow-hidden">
            <img src={guardchicksLogo} alt="GuardChicks" className="h-14 w-14 object-contain" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold font-display text-foreground">GuardChicks</h1>
            <p className="text-sm text-muted-foreground mt-1">Recuperar Contraseña</p>
          </div>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="pb-4">
            <h2 className="text-lg font-semibold text-card-foreground text-center">
              {success ? 'Correo enviado' : 'Restablecer contraseña'}
            </h2>
          </CardHeader>

          {success ? (
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center gap-3 text-center">
                <CheckCircle2 className="h-12 w-12 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Se ha enviado un enlace de restablecimiento a <span className="font-medium text-foreground">{email}</span>. Revisa tu bandeja de entrada y sigue las instrucciones.
                </p>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                </p>
                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@smartcity.ec"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Enviar enlace
                </Button>
              </CardFooter>
            </form>
          )}

          <CardFooter className="justify-center pt-0">
            <Link to="/login" className="inline-flex items-center gap-1 text-sm text-primary font-medium hover:underline">
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
