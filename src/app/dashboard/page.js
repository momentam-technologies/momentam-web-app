import dynamic from 'next/dynamic';

// Dynamically import components that use browser-specific APIs
const DynamicComponent = dynamic(() => import('../components/DynamicComponent'), {
  ssr: false,
});

export default function Dashboard() {
  return (
    <div>
      {/* Other components */}
      <DynamicComponent />
    </div>
  );
}
