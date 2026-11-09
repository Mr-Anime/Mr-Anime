export default function PageHeader({ title, description, children }) {
  return (
    <div className="mb-6 md:mb-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">{title}</h1>
      {description && <p className="mt-1.5 max-w-2xl text-sm text-zinc-400 md:text-base">{description}</p>}
      {children}
    </div>
  );
}
