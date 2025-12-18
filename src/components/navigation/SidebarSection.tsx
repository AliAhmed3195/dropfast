interface SidebarSectionProps {
  title: string;
}

export default function SidebarSection({ title }: SidebarSectionProps) {
  return (
    <div className="px-3 py-2">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {title}
      </h3>
    </div>
  );
}
