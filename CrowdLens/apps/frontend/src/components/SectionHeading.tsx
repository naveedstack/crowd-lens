interface SectionHeadingProps {
  title: string;
  subtitle: string;
  centered?: boolean;
  light?: boolean;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  subtitle,
  centered = false,
}) => {
  return (
    <div className={`mb-12 ${centered ? "text-center" : ""}`}>
      <h2 className={`font-display text-3xl font-bold tracking-tight text-fg md:text-4xl ${centered ? "" : ""}`}>
        {title}
      </h2>
      <p className={`mt-4 text-lg text-fg-muted max-w-2xl ${centered ? "mx-auto" : ""}`}>
        {subtitle}
      </p>
    </div>
  );
};

export default SectionHeading;
