import { Card, CardContent } from "@/components/ui/card";

export function ComingSoon() {
  return (
    <section className="w-full">
      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 px-6">
          <h3 className="text-2xl font-bold mb-2">Movie Club Awards</h3>
          <p className="text-muted-foreground text-center">
            Coming Soon - Stay tuned for our annual awards ceremony!
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
