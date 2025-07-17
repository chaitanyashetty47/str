export default function PageHeaderTemplate({ title, description }: { title: string, description: string }) {
  return (
    <div className="max-w-5xl pl-4">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-muted-foreground mt-2">
        {description}
      </p>
    </div>
  )
}


