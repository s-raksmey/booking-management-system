import { Clock, Users, CheckCircle, Bell, Wifi, Projector } from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    {
      icon: <Clock className="h-8 w-8 text-blue-600" />,
      title: "Real-Time Booking",
      description: "Instant room reservation with live availability updates."
    },
    {
      icon: <Users className="h-8 w-8 text-blue-600" />,
      title: "Role Management",
      description: "Different access levels for admins and staff."
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-blue-600" />,
      title: "Approval Workflow",
      description: "Custom approval rules for different rooms."
    },
    {
      icon: <Bell className="h-8 w-8 text-blue-600" />,
      title: "Smart Notifications",
      description: "Email, SMS, and Telegram reminders."
    },
    {
      icon: <Wifi className="h-8 w-8 text-blue-600" />,
      title: "Resource Booking",
      description: "Reserve equipment and services with your room."
    },
    {
      icon: <Projector className="h-8 w-8 text-blue-600" />,
      title: "Room Management",
      description: "Add amenities and set restrictions easily."
    }
  ];

  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Powerful Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="p-6 rounded-lg hover:shadow-md transition-shadow">
              <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}