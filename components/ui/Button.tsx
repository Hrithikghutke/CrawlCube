export default function Button({
 children,
 color,
}: {
 children: React.ReactNode;
 color: string;
}) {
 return (
 <button
 style={{ backgroundColor: color }}
 className="px-6 py-3 rounded-xl font-semibold text-black hover:opacity-90 transition-all duration-300"
 >
 {children}
 </button>
 );
}
