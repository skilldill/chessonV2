import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { API_PREFIX } from "../../constants/api";
import { HomeScreen } from "../../screens/HomeScreen/HomeScreen";

export const MainAuthGuard = () => {
  const history = useHistory();
  const [checking, setChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_PREFIX}/auth/me`, {
          credentials: "include",
        });

        const data = await response.json();

        if (data.success && data.user) {
          setIsAuthenticated(true);
        } else {
          history.replace("/");
        }
      } catch (err) {
        console.error("Auth check error:", err);
        history.replace("/");
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, [history]);

  if (checking) {
    return (
      <div className="w-full h-[100vh] flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4F39F6] border-t-transparent mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <HomeScreen />;
};
