import { IntroCard } from '@/components/landing/intro/IntroCard';

type Feature = {
  icon: 'holistic' | 'inclusivity' | 'empowerment' | 'community';
  title: string;
  description: string;
};

export function IntroContent() {
  const features: Feature[] = [
    {
      icon: "holistic",
      title: "Holistic Approach",
      description: "Comprehensive wellness programs integrating physical and mental growth"
    },
    {
      icon: "inclusivity",
      title: "Inclusivity",
      description: "Accessible and adaptable programs welcoming individuals from all walks of life"
    },
    {
      icon: "empowerment",
      title: "Empowerment",
      description: "Tools and guidance to break barriers and achieve transformative growth"
    },
    {
      icon: "community",
      title: "Community",
      description: "Supportive environment fostering connection, growth, and shared success"
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {features.map((feature, index) => (
        <IntroCard
          key={index}
          icon={feature.icon}
          title={feature.title}
          description={feature.description}
        />
      ))}
    </div>
  );
}

export default IntroContent;