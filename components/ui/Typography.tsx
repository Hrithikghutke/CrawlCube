export function H1({ children }: { children: React.ReactNode }) {
 return (
 <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
 {children}
 </h1>
 );
}

export function H2({ children }: { children: React.ReactNode }) {
 return <h2 className="text-3xl md:text-4xl font-bold mb-6">{children}</h2>;
}

export function Paragraph({ children }: { children: React.ReactNode }) {
 return <p className="text-lg text-neutral-400 leading-relaxed">{children}</p>;
}
