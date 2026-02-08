import { useAuth } from "@/contexts/AuthContext";
import LandingPage from "@/components/landing/LandingPage";
import AppLayout from "@/components/app/AppLayout";

const Index = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AppLayout /> : <LandingPage />;
};

export default Index;
