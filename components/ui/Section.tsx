export default function Section({
 children,
 className ="",
}: {
 children: React.ReactNode;
 className?: string;
}) {
 return (
 <section className={`py-24 ${className}`}>
 <div className="max-w-6xl mx-auto px-6">{children}</div>
 </section>
 );
}
