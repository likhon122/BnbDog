import React, { useEffect, useState } from 'react';
import './DailyReward.css';
import newLogo from "./images/blanco.png"; // Make sure this path is correct
import { useUser } from "./UserContext"; // Import the user context
import StartStore from "./Starstore"; // Import StartStore component

interface DailyRewardProps {
  onClose: () => void; // Define the type for the onClose prop
}

const DailyReward: React.FC<DailyRewardProps> = ({ onClose }) => {
  const { userID, setPoints } = useUser();
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  const [showStartStore, setShowStartStore] = useState(false); // State to control StartStore visibility

  useEffect(() => {
    const claimDailyReward = async () => {
      try {
        const initData = window.Telegram.WebApp.initData || "";
        // Make a POST request to the endpoint
        const response = await fetch("https://gotem-db.onrender.com/gamer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Telegram-Init-Data": initData, // Add initData to headers
          },
          body: JSON.stringify({ GamerId: userID }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch gamer data");
        }

        const data = await response.json();
        const hookspeedtime = data.data.hookspeedtime || 1;

        const result = 50 * hookspeedtime;
        setRewardAmount(result);

        // Increase totalgot
        const increaseTotalgotResponse = await fetch(
          "https://gotem-db.onrender.com/increase_totalgot",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Telegram-Init-Data": initData,
            },
            body: JSON.stringify({ UserId: userID, Amount: result }),
          }
        );

        if (!increaseTotalgotResponse.ok) {
          throw new Error("Failed to increase total BNBDOG");
        }

        const increaseTotalgotData = await increaseTotalgotResponse.json();

        // Update gamer
        const now = Math.floor(Date.now() / 1000);
        const updateGamerResponse = await fetch(
          "https://gotem-db.onrender.com/update_gamer",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Telegram-Init-Data": initData,
            },
            body: JSON.stringify({ GamerId: userID, startime: now }),
          }
        );

        if (!updateGamerResponse.ok) {
          throw new Error("Failed to update gamer start time");
        }

        // Update points in context
        setPoints(increaseTotalgotData.totalgot || result);
      } catch (error) {
        console.error("Error claiming daily reward:", error);
      }
    };

    claimDailyReward();
  }, [userID, setPoints]);

  return (
    <div className="daily-reward-container">
      <div
        className="fixed inset-0 w-full h-full backdrop-blur-3xl -z-10"
        style={{
          background: "radial-gradient(circle, #312726, #50412f"
        }}
      ></div>
      <div>
        <h1 className="title text-3xl text-[#fbc688]">Your Daily Record</h1>
        <p className="font-normal text-[#C6C6C6] text-center ">
          Come back tomorrow <br /> for new Daily bonus and new Task!
        </p>
      </div>
      <div className="reward-amount-container">
        <p className="reward-amount text-center ">{rewardAmount}</p>
        <div className="flex gap-2 items-center justify-center">
          <img src={newLogo} alt="logo" className="w-[60px] h-[60px]" />
          <p className="text-[#fbc688]">BNBDOG Earned</p>
        </div>
      </div>

      <button
        className="bg-[#0075d9] px-10 py-4 rounded-lg font-normal text-[20px]"
        onClick={() => setShowStartStore(true)}
      >
        Boosting Reward
      </button>
      <button
        className="border border-[#0075d9] rounded-lg font-normal text-[20px] px-8 py-3 mb-6 hover:bg-[#0075d9] text-[#0075d9] hover:text-white transition duration-300"
        onClick={onClose}
      >
        Continue
      </button>

      <div className="overflow-hidden">
        {showStartStore && (
          <StartStore onClose={() => setShowStartStore(false)} /> // Render StartStore when button is clicked
        )}
      </div>
    </div>
  );
};

export default DailyReward;
