import React from 'react';
import { UserPlus, LineChart, Globe, Clock, Shield, Coins } from 'lucide-react';
import SectionHeading from '../components/SectionHeading';
import Card from '../components/Card';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <Card hover className="h-full">
      <div className="bg-gradient-to-br from-violet-600 to-violet-700 w-12 h-12 rounded-lg flex items-center justify-center mb-4 shadow-lg">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </Card>
  );
};

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <UserPlus className="text-white h-6 w-6" />,
      title: 'Real Human Feedback',
      description: 'Get honest opinions from real people, not algorithms or bots. Our decentralized network ensures authentic engagement.'
    },
    {
      icon: <LineChart className="text-white h-6 w-6" />,
      title: 'Data-Driven Insights',
      description: 'Detailed analytics show exactly which thumbnails resonate with your audience and why they perform better.'
    },
    {
      icon: <Globe className="text-white h-6 w-6" />,
      title: 'Global Audience',
      description: 'Access feedback from diverse demographics worldwide to ensure your content appeals to your target audience.'
    },
    {
      icon: <Clock className="text-white h-6 w-6" />,
      title: 'Quick Turnaround',
      description: 'Receive results within hours, not days. Make timely adjustments to your content strategy.'
    },
    {
      icon: <Shield className="text-white h-6 w-6" />,
      title: 'Secure & Private',
      description: 'Your content is protected with Web3-grade security. Control exactly who sees what and when.'
    },
    {
      icon: <Coins className="text-white h-6 w-6" />,
      title: 'Cost Effective',
      description: 'Pay only for the feedback you need. No wasteful subscriptions or hidden fees.'
    }
  ];

  return (
    <section id="features" className="py-20 bg-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Features Designed for Content Creators"
          subtitle="Everything you need to optimize your thumbnails and maximize your viewer engagement."
          centered
          light
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;