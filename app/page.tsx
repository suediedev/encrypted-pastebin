import CreateSnippet from "@/components/create-snippet";

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Secure Pastebin</h1>
          <p className="text-muted-foreground">
            Share encrypted text snippets securely with optional password protection and expiration
          </p>
        </div>
        <CreateSnippet />
      </div>
    </main>
  );
}