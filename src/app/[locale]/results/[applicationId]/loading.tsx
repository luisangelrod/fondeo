export default function ResultsLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md space-y-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <h2 className="text-xl font-semibold">
          Analizando tu perfil... / Analyzing your profile...
        </h2>
        <p className="text-muted-foreground text-sm">
          Esto puede tomar unos segundos.
          <br />
          This may take a few seconds.
        </p>
      </div>
    </div>
  );
}
