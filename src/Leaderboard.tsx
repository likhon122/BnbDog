import React, { useEffect, useState } from "react";
import { useUser } from "./UserContext"; // Import UserContext

import { RiShieldStarLine } from "react-icons/ri";

const LeaderboardPage: React.FC = () => {
  const { userID } = useUser(); // Access userID from UserContext

  const [ownRanking, setOwnRanking] = useState({
    username: "",
    totalgot: 0,
    position: 0
  });

  const [leaderboardData, setLeaderboardData] = useState<
    Array<{ username: string; totalgot: number; position: number }>
  >([]);
  const [totalUsers, setTotalUsers] = useState("0");

  // Function to save data to localStorage
  const saveToLocalStorage = (key: string, value: any) => {
    const data = {
      value,
      timestamp: new Date().getTime()
    };
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Function to retrieve data from localStorage
  const getFromLocalStorage = (key: string, expiry: number = 5 * 60 * 1000) => {
    const dataString = localStorage.getItem(key);
    if (!dataString) return null;

    const data = JSON.parse(dataString);
    const now = new Date().getTime();

    // Check if data is not expired
    if (now - data.timestamp > expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return data.value;
  };

  useEffect(() => {
    // Load leaderboard data from localStorage if available
    const storedLeaderboardData = getFromLocalStorage("leaderboardData");
    const storedOwnRanking = getFromLocalStorage("ownRanking");
    const storedTotalUsers = getFromLocalStorage("totalUsers");

    if (storedLeaderboardData) {
      setLeaderboardData(storedLeaderboardData);
    }
    if (storedOwnRanking) {
      setOwnRanking(storedOwnRanking);
    }
    if (storedTotalUsers) {
      setTotalUsers(storedTotalUsers);
    }

    // Fetch latest leaderboard data from the server
    const fetchLeaderboardData = async () => {
      try {
        const initData = window.Telegram.WebApp.initData || ""; // Get initData from Telegram WebApp
        const response = await fetch(
          `https://gotem-db.onrender.com/get_user_ranking?UserId=${userID}`,
          {
            headers: {
              "X-Telegram-Init-Data": initData // Add initData to headers
            }
          }
        );
        const data = await response.json();

        if (data.requested_user) {
          const userRanking = {
            username: data.requested_user.username,
            totalgot: data.requested_user.totalgot,
            position: data.requested_user.position
          };
          setOwnRanking(userRanking);
          saveToLocalStorage("ownRanking", userRanking);
        }

        if (data.top_users) {
          const formattedLeaderboardData = data.top_users.map((user: any) => ({
            username: user.username,
            totalgot: user.totalgot,
            position: user.rank
          }));
          setLeaderboardData(formattedLeaderboardData);
          saveToLocalStorage("leaderboardData", formattedLeaderboardData);
        }

        if (data.total_users) {
          setTotalUsers(data.total_users);
          saveToLocalStorage("totalUsers", data.total_users);
        }
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      }
    };

    fetchLeaderboardData();
  }, [userID]);

  return (
    <div className="relative inset-0 text-white z-10 pb-24">
      {" "}
      {/* Added pb-24 for bottom padding */}
      <div className="flex flex-col items-center pt-5 h-[94vh] overflow-y-scroll hide-scrollbar">
        <h1 className="text-2xl font-bold mb-5 text-center w-full">
          HALL OF FAME
        </h1>
        {ownRanking && (
          <div className="shadow-lg w-11/12  rounded-full flex items-center justify-between px-6 py-4 mb-5  bg-[#0075d9] text-white">
            <div className="flex items-center">
              <div className=" rounded-full w-14 h-14 flex items-center justify-center  text-lg font-bold">
                <RiShieldStarLine size={43} />
              </div>
              <div className="ml-4">
                <p className="font-bold text-lg ">{ownRanking.username}</p>
                <p className=" text-sm">{ownRanking.totalgot} Point</p>
              </div>
            </div>
            <p className=" text-base font-semibold">#{ownRanking.position}</p>
          </div>
        )}
        <div className="w-11/12   rounded-lg shadow-lg">
          <p className="text-xl font-bold mb-4">{totalUsers} holders</p>
          {leaderboardData.map((user, index) => (
            <div
              key={index}
              className="flex items-center justify-between mb-3 p-2 bg-[#141111] bg-opacity-60 backdrop-filter backdrop-blur-lg rounded-lg"
            >
              <div className="flex items-center">
                <div
                  className="rounded-full w-12 h-12 flex items-center justify-center text-white text-lg font-bold"
                  style={{
                    backgroundColor:
                      index === 0
                        ? "#0075d9"
                        : index === 1
                        ? "#a15c7f"
                        : index === 2
                        ? "#527052"
                        : "#6e6767"
                  }} // Circle color changes based on rank
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="ml-4">
                  <p className="font-bold text-sm">{user.username}</p>
                  <p className="text-gray-400 text-sm">
                    {user.totalgot} BNBDOG
                  </p>
                </div>
              </div>
              <p className="text-gray-300 text-sm">#{user.position}</p>
            </div>
          ))}
        </div>
        <div className="h-20"></div> {/* Space for footer */}
      </div>
    </div>
  );
};

export default LeaderboardPage;
