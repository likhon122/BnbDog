import React, { useEffect, useState } from "react";

import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { Toaster } from "react-hot-toast";
import { BiLogoTelegram } from "react-icons/bi";
import { BsTwitterX } from "react-icons/bs";
import {
  FaDiscord,
  FaFacebookF,
  FaUserFriends,
  FaYoutube
} from "react-icons/fa";
import { FaRankingStar } from "react-icons/fa6";
import { IoHome } from "react-icons/io5";
import { TfiGift } from "react-icons/tfi";
import "./App.css";
import DailyReward from "./DailyReward";
import FriendsPage from "./Friends";
import { main } from "./images";
import newLogo from "./images/blanco.png";
import doneIcon from "./images/done.png";
import Leaderboard from "./Leaderboard";
import LoadingScreen from "./LoadingScreen";
import Modal from "./Modal";
import OverlayPage from "./overlaypage";
import { useUser } from "./UserContext";

declare const Telegram: any;

interface TaskItemProps {
  icon?: React.ReactNode | string; // Updated from 'element' to 'ReactNode'
  title: string;
  reward?: number; // Made reward optional
  status?: "not_started" | "loading" | "claimable" | "completed"; // Made status optional
  onClick?: () => void;
  onClaim?: () => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  icon,
  title,
  reward,
  onClick,
  onClaim,
  status = "not_started" // Default status
}) => {
  return (
    <div
      onClick={status === "not_started" && onClick ? onClick : undefined}
      className={`flex items-center justify-between bg-[#141111]/30 bg-opacity-60 backdrop-filter backdrop-blur-lg rounded-2xl p-4 mb-3 shadow-lg transition-shadow duration-300 ${
        status === "not_started" ? "cursor-pointer hover:shadow-2xl" : ""
      } ${status === "completed" ? "opacity-50 cursor-not-allowed" : ""}`}
      style={{
        backdropFilter: "blur(8px)",
        border: "1px solid #FFFFFF3D"
      }}
    >
      {icon ? (
        <div className="flex items-center gap-4">
          <div className="">
            {typeof icon === "string" ? (
              <img className="h-12 w-12" src={icon} alt="Img" />
            ) : (
              <div className="text-[22px] px-[8px] py-2 rounded-lg text-white bg-[#0075d9]">
                {icon}
              </div>
            )}
          </div>
          <div className="text-white">
            <div className="font-bold text-sm">{title}</div>
            {reward !== undefined && (
              <div className="flex items-center text-xs mt-1">
                <img src={newLogo} alt="logo" className="w-5 mr-2" />+{reward}{" "}
                Point{reward !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center">
          <div className="text-white">
            <div className="font-bold text-sm">{title}</div>
          </div>
        </div>
      )}
      <div className="text-gray-300">
        {status === "completed" && (
          <img src={doneIcon} alt="Done" className="w-6 h-6" />
        )}
        {status === "loading" && <div className="loader"></div>}
        {status === "claimable" && onClaim && (
          <button
            onClick={onClaim}
            className="bg-green-500 text-white px-4 py-1 rounded-full hover:bg-green-600 transition-colors duration-300"
          >
            Claim
          </button>
        )}
        {status === "not_started" && reward !== undefined && (
          <span
            className="text-xl inline-block mb-3"
            style={{ transform: "rotate(330deg)" }}
          >
            ➤
          </span>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { points, setPoints, userID, setUserID, walletid, setWalletAddress } =
    useUser();
  const [tonConnectUI] = useTonConnectUI();
  const address = useTonAddress();
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<{
    [key: string]: "not_started" | "loading" | "claimable" | "completed";
  }>({});
  const [refertotalStatus, setRefertotalStatus] = useState<string | null>(
    "NULL"
  );
  const [showOverlayPage, setShowOverlayPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState("home");
  const [userAdded, setUserAdded] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);

  // New state variable to track if daily reward is available
  const [dailyRewardAvailable, setDailyRewardAvailable] = useState(false);

  // State for fetched tasks
  const [fetchedTasks, setFetchedTasks] = useState<any[]>([]);

  // New state variable to track the current task segment
  const [taskSegment, setTaskSegment] = useState<"BNBDOG" | "additional">(
    "BNBDOG"
  );

  // State variables for BEP20 Address Modal
  const [showBEP20Modal, setShowBEP20Modal] = useState(false);
  const [bep20Address, setBep20Address] = useState("");

  const closeModal = () => setModalMessage(null);

  const closeOverlay = () => {
    setShowOverlayPage(false);
    if (dailyRewardAvailable) {
      setShowDailyReward(true);
    }
  };

  const showAlert = (message: string) => {
    setModalMessage(message);
  };

  const [lastSavedPoints, setLastSavedPoints] = useState<number>(points);

  const savePoints = async () => {
    if (!userID) return;
    const initData = window.Telegram.WebApp.initData || "";

    try {
      await fetch("https://gotem-db.onrender.com/update_user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Init-Data": initData
        },
        body: JSON.stringify({ UserId: userID, totalgot: points })
      });
      console.log("Points saved:", points);
      setLastSavedPoints(points);
    } catch (error) {
      console.error("Failed to save points:", error);
    }
  };

  useEffect(() => {
    if (points !== lastSavedPoints) {
      savePoints();
    }
  }, [points, lastSavedPoints]);

  useEffect(() => {
    const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
      if (wallet) {
        console.log("wallet info: ", wallet);
      }
    });
    return () => unsubscribe();
  }, [tonConnectUI]);

  useEffect(() => {
    setWalletAddress(address);
  }, [address, setWalletAddress]);

  useEffect(() => {
    Telegram.WebApp.ready();

    const initDataUnsafe = Telegram.WebApp.initDataUnsafe;
    const user = {
      username: initDataUnsafe.user?.username || "Default Username",
      userid: initDataUnsafe.user?.id || "45869",
      startparam: initDataUnsafe.start_param || ""
    };

    setUserID(user.userid);
    fetchOrAddUser(user.userid, user.startparam, user.username);
  }, [walletid]);

  const fetchOrAddUser = async (
    userid: string,
    startparam: string,
    username: string
  ) => {
    try {
      const initData = window.Telegram.WebApp.initData || "";

      const response = await fetch(
        `https://gotem-db.onrender.com/get_user?UserId=${userid}`,
        {
          headers: {
            "X-Telegram-Init-Data": initData
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        await loadPoints(userid);
        loadTaskStatus(data);
        setShowOverlayPage(false); // User exists, no need to show overlay
      } else {
        throw new Error("User not found");
      }
    } catch (error) {
      // User not found, add the user
      await addUser(userid, startparam, username);
    }
  };

  const addUser = async (
    userid: string,
    startparam: string,
    username: string
  ) => {
    const invitedBy = !startparam || userid === startparam ? null : startparam;
    const initData = window.Telegram.WebApp.initData || "";

    try {
      await fetch("https://gotem-db.onrender.com/add_user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Init-Data": initData
        },
        body: JSON.stringify({
          UserId: userid,
          invitedby: invitedBy || undefined,
          Username: username
        })
      });
      console.log("User added");
      setUserAdded(true); // Indicate that the user has been added
      setShowOverlayPage(true);
    } catch (error) {
      console.log("Error adding user:", error);
    }
  };

  const loadPoints = async (userid: string) => {
    const initData = window.Telegram.WebApp.initData || "";

    try {
      const response = await fetch(
        `https://gotem-db.onrender.com/get_user?UserId=${userid}`,
        {
          headers: {
            "X-Telegram-Init-Data": initData
          }
        }
      );
      const data = await response.json();
      if (data && data.data && data.data.totalgot !== undefined) {
        setPoints(data.data.totalgot);
        setLastSavedPoints(data.data.totalgot);
      }
    } catch (error) {
      console.error("Failed to load points:", error);
    }
  };

  const loadTaskStatus = (data: any) => {
    // Log data to verify structure
    console.log("User data:", data);

    const updatedTaskStatus: { [key: string]: "not_started" | "completed" } = {
      // Predefined tasks
      task1: data.data.task1 === "Done" ? "completed" : "not_started", // Join BNBDOG TG channel
      task2: data.data.task2 === "Done" ? "completed" : "not_started", // Join BNBDOG Whatsapp channel
      task3: data.data.task3 === "Done" ? "completed" : "not_started", // Join BNBDOG TG English-Chat
      task4: data.data.task4 === "Done" ? "completed" : "not_started", // Follow our CEO TG channel
      task5: data.data.task5 === "Done" ? "completed" : "not_started", // Follow our CEO Wp channel
      task6: data.data.task6 === "Done" ? "completed" : "not_started", // Join BNBDOG CMC channel
      X: data.data.X === "Done" ? "completed" : "not_started", // Follow BNBDOG on X
      task7: data.data.task7 === "Done" ? "completed" : "not_started", // Follow Our CEO on X
      YouTube: data.data.youtube === "Done" ? "completed" : "not_started", // Subscribe To BNBDOG YT
      task14: data.data.task14 === "Done" ? "completed" : "not_started", // Subscribe To Our CEO YT
      task8: data.data.task8 === "Done" ? "completed" : "not_started", // Follow Our CEO on IG
      task9: data.data.task9 === "Done" ? "completed" : "not_started", // Follow Our CEO on Facebook
      Invite5Friends:
        data.data.Invite5Friends === "Done" ? "completed" : "not_started",
      task10: data.data.task10 === "Done" ? "completed" : "not_started", // Invite 10 Friends
      task11: data.data.task11 === "Done" ? "completed" : "not_started", // Invite 20 Friends
      task12: data.data.task12 === "Done" ? "completed" : "not_started", // Invite 50 Friends
      BEP20Task: data.data.task15 === "Done" ? "completed" : "not_started", // Add your BEP20 address
      task16: data.data.task16 === "Done" ? "completed" : "not_started", // Register on the WhiteList
      task17: data.data.task17 === "Done" ? "completed" : "not_started" // React & share the Latest Post on TG
    };

    setTaskStatus((prevStatus) => ({
      ...prevStatus,
      ...updatedTaskStatus
    }));
    setRefertotalStatus(data.data.Refertotal || "NULL");
  };

  const saveTaskCompletion = async (
    taskKey: string,
    column: string,
    reward: number
  ) => {
    const initData = window.Telegram.WebApp.initData || "";

    try {
      await fetch("https://gotem-db.onrender.com/update_user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Init-Data": initData
        },
        body: JSON.stringify({ UserId: userID, [column]: "Done" })
      });

      setTaskStatus((prevState) => ({
        ...prevState,
        [taskKey]: "completed"
      }));

      setPoints((prevPoints) => prevPoints + reward);
      showAlert(`Thank you! You have earned ${reward} Points.`);
    } catch (error) {
      console.error(`Failed to complete task ${taskKey}:`, error);
      showAlert(
        "An error occurred while completing the task. Please try again later."
      );
    }
  };

  const extractChatId = (link: string): string => {
    const parts = link.split("/");
    const lastPart = parts[parts.length - 1];
    return "@" + lastPart;
  };

  const handleTelegramTaskClick = async (taskKey: string, link: string) => {
    window.open(link, "_blank");

    const chatId = extractChatId(link);
    const userId = userID;

    setTaskStatus((prevState) => ({
      ...prevState,
      [taskKey]: "loading"
    }));

    setTimeout(async () => {
      const initData = window.Telegram.WebApp.initData || "";

      try {
        const response = await fetch(
          `https://gotem-db.onrender.com/check_telegram_status?user_id=${userId}&chat_id=${chatId}`,
          {
            headers: {
              "X-Telegram-Init-Data": initData
            }
          }
        );
        const data = await response.json();

        if (data.status === "1") {
          setTaskStatus((prevState) => ({
            ...prevState,
            [taskKey]: "claimable"
          }));
        } else {
          setTaskStatus((prevState) => ({
            ...prevState,
            [taskKey]: "not_started"
          }));
          showAlert("Not found, please try again.");
        }
      } catch (error) {
        console.error("Error checking Telegram status:", error);
        setTaskStatus((prevState) => ({
          ...prevState,
          [taskKey]: "not_started"
        }));
        showAlert("An error occurred. Please try again.");
      }
    }, 6000); // 6 seconds delay
  };

  const handleTaskClick = (taskKey: string, link: string) => {
    window.open(link, "_blank");

    setTaskStatus((prevState) => ({
      ...prevState,
      [taskKey]: "loading"
    }));

    setTimeout(() => {
      setTaskStatus((prevState) => ({
        ...prevState,
        [taskKey]: "claimable"
      }));
    }, 5000);
  };

  const handleTaskClaim = (taskKey: string, column: string, reward: number) => {
    saveTaskCompletion(taskKey, column, reward);
  };

  // Updated to accept parameters for different invite tasks
  const handleInviteFriendsClick = async (
    taskKey: string,
    column: string,
    reward: number
  ) => {
    if (refertotalStatus === "NULL" || !refertotalStatus) {
      showAlert("Not Enough Friends");
    } else if (refertotalStatus === "Approve") {
      const initData = window.Telegram.WebApp.initData || "";

      try {
        await fetch("https://gotem-db.onrender.com/update_user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Telegram-Init-Data": initData
          },
          body: JSON.stringify({ UserId: userID, [column]: "Done" })
        });

        setTaskStatus((prevState) => ({
          ...prevState,
          [taskKey]: "completed"
        }));

        setPoints((prevPoints) => prevPoints + reward);
        setRefertotalStatus("Done");
        showAlert(
          `Congratulations! You have completed the Invite ${
            reward === 5000
              ? "5"
              : reward === 10000
              ? "10"
              : reward === 20000
              ? "20"
              : "50"
          } Friends task and earned ${reward} Points.`
        );
      } catch (error) {
        console.error(`Failed to complete ${taskKey} task:`, error);
        showAlert(
          "An error occurred while completing the task. Please try again later."
        );
      }
    }
  };

  // Handle clicks for fetched tasks
  const handleFetchedTaskClick = (task: any) => {
    // Check if task is already completed
    if (taskStatus[task.taskid.toString()] === "completed") {
      return; // Do nothing if task is completed
    }

    // Use the link provided by the task to open in a new tab or default to "#"
    const taskLink = task.tasklink || "#";
    window.open(taskLink, "_blank");

    // Set task status to "loading"
    setTaskStatus((prevState) => ({
      ...prevState,
      [task.taskid.toString()]: "loading"
    }));

    // Simulate an asynchronous operation to make the task claimable
    setTimeout(() => {
      setTaskStatus((prevState) => ({
        ...prevState,
        [task.taskid.toString()]: "claimable"
      }));
    }, 5000); // Adjust the delay as needed
  };

  // Handle claims for fetched tasks
  const handleFetchedTaskClaim = async (task: any) => {
    try {
      const initData = window.Telegram.WebApp.initData || "";

      // First API call: Mark task as done
      const markDoneResponse = await fetch(
        "https://gotem-db.onrender.com/mark_task_done",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Telegram-Init-Data": initData
          },
          body: JSON.stringify({
            userid: userID,
            taskid: task.taskid
          })
        }
      );

      const markDoneData = await markDoneResponse.json();

      if (!markDoneResponse.ok) {
        console.log(
          "Warning: Failed to mark task as done. Proceeding with increasing points."
        );
      } else if (
        !markDoneData.success &&
        markDoneData.message !== "Task marked as done for existing user" &&
        markDoneData.message !== "Task already marked as done"
      ) {
        console.log(
          "Warning: Task already marked as done or other non-critical issue."
        );
      }

      // Second API call: Increase total points (totalgot)
      const increasePointsResponse = await fetch(
        "https://gotem-db.onrender.com/increase_totalgot",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Telegram-Init-Data": initData
          },
          body: JSON.stringify({
            UserId: userID,
            Amount: task.taskreward
          })
        }
      );

      const increasePointsData = await increasePointsResponse.json();

      if (
        !increasePointsResponse.ok ||
        !increasePointsData.totalgot ||
        !increasePointsData.message.includes("Total got updated successfully")
      ) {
        throw new Error(
          "Failed to increase points. Backend response indicates failure."
        );
      }

      // Update task status to completed if successful
      setTaskStatus((prevStatus) => ({
        ...prevStatus,
        [task.taskid.toString()]: "completed"
      }));

      // Update user's points
      setPoints(increasePointsData.totalgot);

      // Show success alert
      showAlert(
        `You have earned ${task.taskreward} Points. Your total is now ${increasePointsData.totalgot} Points.`
      );
    } catch (error) {
      // Enhanced error message for debugging
      console.error("Failed to claim task:", error);
      showAlert(
        "An error occurred while claiming the task. Please try again later."
      );

      // Set task status back to not started only if increasing points failed
      setTaskStatus((prevStatus) => ({
        ...prevStatus,
        [task.taskid.toString()]: "not_started"
      }));
    }
  };

  // Function to handle BEP20 Address Submission
  const handleBEP20Submit = async () => {
    setShowBEP20Modal(false); // Close the modal

    if (!bep20Address.trim()) {
      // Show an alert
      showAlert("No address found");
    } else {
      const initData = window.Telegram.WebApp.initData || "";

      try {
        // Update walletid and task15 using update_user API
        const response = await fetch(
          "https://gotem-db.onrender.com/update_user",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Telegram-Init-Data": initData
            },
            body: JSON.stringify({
              UserId: userID,
              walletid: bep20Address.trim(),
              task15: "Done"
            })
          }
        );

        if (response.ok) {
          // Mark the task as completed
          setTaskStatus((prevState) => ({
            ...prevState,
            BEP20Task: "completed"
          }));

          // Reward the user with 100 points
          setPoints((prevPoints) => prevPoints + 100);

          // Show success alert
          showAlert("Address Saved");
        } else {
          throw new Error("Failed to save address");
        }
      } catch (error) {
        console.error("Error saving BEP20 address:", error);
        showAlert(
          "An error occurred while saving the address. Please try again."
        );
      }
    }

    // Navigate back to home page and clear the input field
    setActivePage("home");
    setBep20Address("");
  };

  // Fetch tasks from the API and mark the completed ones
  useEffect(() => {
    const fetchTasks = async () => {
      const initData = window.Telegram.WebApp.initData || "";

      try {
        const response = await fetch(
          `https://gotem-db.onrender.com/get_user_tasks?userid=${userID}`,
          {
            headers: {
              "X-Telegram-Init-Data": initData
            }
          }
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch tasks: ${response.status}`);
        }

        const data = await response.json();
        if (data) {
          if (data.task_details) {
            setFetchedTasks(data.task_details);
          }

          // Handle completed tasks
          let completedTasks: number[] = [];
          if (data.completed_tasks) {
            if (Array.isArray(data.completed_tasks)) {
              completedTasks = data.completed_tasks.map((id: any) =>
                parseInt(id, 10)
              );
            } else if (typeof data.completed_tasks === "string") {
              completedTasks = data.completed_tasks
                .split(",")
                .map((id: string) => parseInt(id, 10))
                .filter((id: number) => !isNaN(id));
            } else if (typeof data.completed_tasks === "number") {
              completedTasks = [data.completed_tasks];
            }
          }

          // Initialize task status for fetched tasks
          const newTaskStatus: { [key: string]: "not_started" | "completed" } =
            {};
          data.task_details.forEach((task: any) => {
            newTaskStatus[task.taskid.toString()] = completedTasks.includes(
              task.taskid
            )
              ? "completed"
              : "not_started";
          });

          setTaskStatus((prevStatus) => ({
            ...prevStatus,
            ...newTaskStatus
          }));
        }
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      }
    };

    if (userID) {
      fetchTasks();
    }
  }, [userID]);

  // Render tasks based on the selected segment
  const renderTasks = () => {
    if (taskSegment === "BNBDOG") {
      return (
        <div className="mt-6 px-4">
          {/* Task 1: Join BNBDOG TG channel */}
          <TaskItem
            icon={<BiLogoTelegram />}
            title="Join BNBDOG TG channel"
            reward={1000}
            status={taskStatus["task1"] || "not_started"}
            onClick={() =>
              handleTelegramTaskClick("task1", "https://t.me/MoonupCrypto")
            }
            onClaim={() => handleTaskClaim("task1", "task1", 1000)}
          />

          {/* Task 3: Join BNBDOG TG English-Chat */}
          <TaskItem
            icon={<BiLogoTelegram />}
            title="Join our Telegram Group"
            reward={1000}
            status={taskStatus["task3"] || "not_started"}
            onClick={() =>
              handleTelegramTaskClick("task3", "https://t.me/BNBDOGINUOFFICIAL")
            }
            onClaim={() => handleTaskClaim("task3", "task3", 1000)}
          />

          {/* Task 5: Follow our CEO Wp channel */}
          <TaskItem
            icon={<FaDiscord />}
            title="Join our Discord Server"
            reward={1000}
            status={taskStatus["task5"] || "not_started"}
            onClick={() =>
              handleTaskClick("task5", "https://discord.gg/kwv3qrDmUk)")
            }
            onClaim={() => handleTaskClaim("task5", "task5", 1000)}
          />

          <TaskItem
            icon={<BsTwitterX />}
            title="Follow our X profile"
            reward={100}
            status={taskStatus["task7"] || "not_started"}
            onClick={() =>
              handleTaskClick("task7", "https://twitter.com/bnb_dog)")
            }
            onClaim={() => handleTaskClaim("task7", "task7", 1000)}
          />

          <TaskItem
            icon={<FaYoutube />}
            title="Join this YouTube channel"
            reward={1000}
            status={taskStatus["task14"] || "not_started"} // Updated to task14
            onClick={() =>
              handleTaskClick(
                "task14",
                "https://youtu.be/eqHF1Li516c?si=EPfQqzJl5ZnUGuUY"
              )
            }
            onClaim={() => handleTaskClaim("task14", "task14", 1000)} // Updated to task14
          />

          {/* Task 12: Follow to Our CEO on Facebook */}
          <TaskItem
            icon={<FaFacebookF />}
            title=" Follow our Facebook group"
            reward={1000}
            status={taskStatus["task9"] || "not_started"}
            onClick={() =>
              handleTaskClick(
                "task9",
                "https://www.facebook.com/groups/834469468420892)"
              )
            }
            onClaim={() => handleTaskClaim("task9", "task9", 1000)}
          />

          {/* Task 16: Register on the WhiteList */}
          <TaskItem
            icon={main} // You can choose a more appropriate icon if available
            title="Join and buy on the exchange"
            reward={10000}
            status={taskStatus["task16"] || "not_started"}
            onClick={() =>
              handleTaskClick(
                "task16",
                "https://www.indoex.io/trade/BNBDOG_USDT"
              )
            }
            onClaim={() => handleTaskClaim("task16", "task16", 10000)}
          />

          {/* Task 13: Invite 5 Friends */}
          <TaskItem
            icon={<TfiGift />}
            title="Invite 5 Friends"
            reward={5000}
            status={taskStatus["Invite5Friends"] || "not_started"}
            onClick={() =>
              handleInviteFriendsClick("Invite5Friends", "Invite5Friends", 5000)
            }
          />

          {/* Task 14: Invite 10 Friends */}
          <TaskItem
            icon={<TfiGift />}
            title="Invite 10 Friends"
            reward={10000}
            status={taskStatus["task10"] || "not_started"}
            onClick={() => handleInviteFriendsClick("task10", "task10", 10000)}
          />

          {/* Task 15: Invite 20 Friends */}
          <TaskItem
            icon={<TfiGift />}
            title="Invite 20 Friends"
            reward={20000}
            status={taskStatus["task11"] || "not_started"}
            onClick={() => handleInviteFriendsClick("task11", "task11", 20000)}
          />

          {/* Task 16: Invite 50 Friends */}
          <TaskItem
            icon={<TfiGift />}
            title="Invite 50 Friends"
            reward={50000}
            status={taskStatus["task12"] || "not_started"}
            onClick={() => handleInviteFriendsClick("task12", "task12", 50000)}
          />
        </div>
      );
    } else if (taskSegment === "additional") {
      return (
        <div className="mt-6 px-4">
          {/* Dynamically Fetched Tasks */}
          {fetchedTasks.length > 0 ? (
            fetchedTasks.map((task) => (
              <TaskItem
                key={task.taskid}
                icon={task.taskimage}
                title={task.tasktitle}
                reward={task.taskreward}
                status={taskStatus[task.taskid.toString()] || "not_started"}
                onClick={() => handleFetchedTaskClick(task)}
                onClaim={() => handleFetchedTaskClaim(task)}
              />
            ))
          ) : (
            // Coming Soon Placeholder
            <TaskItem title="Coming Soon.." />
          )}
        </div>
      );
    }
    return null;
  };

  // Function to check daily reward status
  const checkDailyRewardStatus = async () => {
    try {
      const initData = window.Telegram.WebApp.initData || "";
      const response = await fetch("https://gotem-db.onrender.com/gamer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Telegram-Init-Data": initData
        },
        body: JSON.stringify({ GamerId: userID })
      });
      if (response.ok) {
        const data = await response.json();
        const startime = data.data.startime;
        if (startime === 0 || startime === null) {
          // Show the daily reward page
          setDailyRewardAvailable(true);
        } else {
          const now = Math.floor(Date.now() / 1000); // Unix time in seconds
          const startDate = new Date(startime * 1000);
          const currentDate = new Date(now * 1000);
          if (
            startDate.getFullYear() !== currentDate.getFullYear() ||
            startDate.getMonth() !== currentDate.getMonth() ||
            startDate.getDate() !== currentDate.getDate()
          ) {
            // Different day, show the daily reward page
            setDailyRewardAvailable(true);
          } else {
            // Same day, don't show the daily reward page
            setDailyRewardAvailable(false);
          }
        }
      } else {
        console.error("Failed to fetch gamer data");
        setDailyRewardAvailable(false);
      }
    } catch (error) {
      console.error("Error fetching gamer data:", error);
      setDailyRewardAvailable(false);
    }
  };

  // Adjust the initial useEffect
  useEffect(() => {
    const preloadPages = async () => {
      if (userID) {
        await loadPoints(userID);
        await checkDailyRewardStatus();

        // Set an artificial delay of 2 seconds
        setTimeout(() => {
          if (!showOverlayPage && dailyRewardAvailable) {
            setShowDailyReward(true);
          }
          setLoading(false); // Remove the loading screen after delay
        }, 2000); // 2-second delay
      }
    };

    preloadPages();
  }, [userID, showOverlayPage, dailyRewardAvailable]);

  return (
    <div className="relative flex justify-center min-h-screen bg-gray-600">
      {loading ? (
        <LoadingScreen />
      ) : (
        <>
          {/* Overlay background */}
          <div
            className="fixed inset-0 w-full h-full backdrop-blur-3xl "
            style={{
              background: "radial-gradient(circle, #312726, #50412f"
            }}
          ></div>

          {/* Main Content */}
          <div className="relative pt-4 md:pt-16 w-full text-white font-bold flex flex-col max-w-xl px-4 ">
            {activePage === "home" && (
              <>
                <div className="z-10 pb-20">
                  {/* Top Box: Smaller Size and Different Shape */}
                  <div className=" p-6 flex flex-col items-center">
                    <img src={main} alt="Token Logo" className="w-32 h-32" />
                    <p className="text-4xl mt-4">{points.toLocaleString()}</p>
                    <p className="text-lg text-gray-400">Points</p>

                    {/* Custom TonConnect Button */}
                    <div className="mt-4 w-auto">
                      <div className="relative">
                        <div
                          className={`h-12 bg-[#0075d9] text-white font-bold rounded-full shadow-md  transition-colors duration-300 flex items-center justify-center cursor-pointer px-6`}
                          onClick={() => {
                            if (address) {
                              tonConnectUI.disconnect();
                            } else {
                              tonConnectUI.connectWallet();
                            }
                          }}
                        >
                          <span className="inline-block w-4 h-4 mr-3 mb-1">
                            {/* SVG Icon */}
                            <svg
                              fill="white"
                              height="20px"
                              width="20px"
                              version="1.1"
                              id="Layer_1"
                              xmlns="http://www.w3.org/2000/svg"
                              xmlnsXlink="http://www.w3.org/1999/xlink"
                              viewBox="0 0 512 512"
                              xmlSpace="preserve"
                            >
                              <g>
                                <g>
                                  <path
                                    d="M361.739,278.261c-27.664,0-50.087,22.423-50.087,50.087s22.423,50.087,50.087,50.087H512V278.261H361.739z
                           M361.739,345.043c-9.22,0-16.696-7.475-16.696-16.696s7.475-16.696,16.696-16.696s16.696,7.475,16.696,16.696
                          S370.96,345.043,361.739,345.043z"
                                  />
                                </g>
                              </g>
                              <g>
                                <g>
                                  <path
                                    d="M361.739,244.87h83.478v-50.087c0-27.619-22.468-50.087-50.087-50.087H16.696C7.479,144.696,0,152.174,0,161.391v333.913
                          C0,504.521,7.479,512,16.696,512H395.13c27.619,0,50.087-22.468,50.087-50.087v-50.087h-83.478
                          c-46.032,0-83.478-37.446-83.478-83.478C278.261,282.316,315.707,244.87,361.739,244.87z"
                                  />
                                </g>
                              </g>
                              <g>
                                <g>
                                  <path
                                    d="M461.913,144.696h-0.158c10.529,13.973,16.854,31.282,16.854,50.087v50.087H512v-50.087
                          C512,167.164,489.532,144.696,461.913,144.696z"
                                  />
                                </g>
                              </g>
                              <g>
                                <g>
                                  <path
                                    d="M478.609,411.826v50.087c0,18.805-6.323,36.114-16.854,50.087h0.158C489.532,512,512,489.532,512,461.913v-50.087H478.609
                          z"
                                  />
                                </g>
                              </g>
                              <g>
                                <g>
                                  <path d="M273.369,4.892c-6.521-6.521-17.087-6.521-23.609,0l-14.674,14.674l91.74,91.738h52.956L273.369,4.892z" />
                                </g>
                              </g>
                              <g>
                                <g>
                                  <path d="M173.195,4.892c-6.521-6.522-17.086-6.522-23.608,0L43.174,111.304h236.435L173.195,4.892z" />
                                </g>
                              </g>
                            </svg>
                          </span>
                          <span className="text-white">
                            {address ? "Disconnect Wallet" : "Connect Wallet"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Animated Gradient Separator */}
                  <div className="my-6">
                    <div className="h-0.5 bg-gradient-to-r from-gray-800 to-gray-200 bg-[#F8D33A] animate-gradient-x" />
                  </div>

                  {/* Enhanced Segment Switcher */}
                  <div className="flex justify-center mb-4 px-4">
                    <div className="flex bg-gray-800 rounded-full overflow-hidden shadow-lg w-full max-w-md">
                      <button
                        className={`flex-1 py-2 px-4 text-center whitespace-nowrap text-sm sm:text-base transition-all duration-300 ${
                          taskSegment === "BNBDOG"
                            ? "bg-[#0075d9] text-white"
                            : "text-gray-400 hover:bg-[#0075d9] hover:text-white"
                        }`}
                        onClick={() => setTaskSegment("BNBDOG")}
                      >
                        BNBDOG Tasks
                      </button>
                      <button
                        className={`flex-1 py-2 px-4 text-center whitespace-nowrap text-sm sm:text-base transition-all duration-300 ${
                          taskSegment === "additional"
                            ? "bg-[#0075d9] text-white"
                            : "text-gray-400 hover:bg-[#0075d9] hover:text-white"
                        }`}
                        onClick={() => setTaskSegment("additional")}
                      >
                        Additional Tasks
                      </button>
                    </div>
                  </div>

                  {/* Render Tasks Based on Selected Segment */}
                  {renderTasks()}
                </div>
              </>
            )}

            {activePage === "friends" && <FriendsPage />}
            {activePage === "leaderboard" && <Leaderboard />}
          </div>

          {/* Navbar */}
          {activePage !== "game" && (
            <div className="fixed bottom-0 left-0 w-full bg-[#312726] bg-opacity-60 backdrop-filter backdrop-blur-lg flex justify-around items-center z-40 rounded-t-3xl shadow-xl">
              <div
                className={`nav-item flex flex-col items-center text-[#c0c0c0] ${
                  activePage === "home" ? "bg-[#0075d9] text-white" : ""
                } w-1/4 p-3 rounded-t-2xl transition-colors duration-300`}
                onClick={() => setActivePage("home")}
              >
                <IoHome size={25} />
                <p className="text-xs">Home</p>
              </div>

              <div
                className={`nav-item flex flex-col items-center text-[#c0c0c0] ${
                  activePage === "friends" ? "bg-[#0075d9] text-white" : ""
                } w-1/4 p-3 rounded-t-2xl transition-colors duration-300`}
                onClick={() => setActivePage("friends")}
              >
                <FaUserFriends size={25} />
                <p className="text-xs">Friends</p>
              </div>

              <div
                className={`nav-item flex flex-col items-center text-[#c0c0c0] ${
                  activePage === "leaderboard" ? "bg-[#0075d9] text-white" : ""
                } w-1/4 p-3 rounded-t-2xl transition-colors duration-300`}
                onClick={() => setActivePage("leaderboard")}
              >
                <FaRankingStar size={25} />
                <p className="text-xs">Ranking</p>
              </div>
            </div>
          )}

          {/* Render OverlayPage first if user is added */}
          {showOverlayPage && (
            <OverlayPage closeOverlay={closeOverlay} userAdded={userAdded} />
          )}
          {/* Render DailyReward after OverlayPage is closed */}
          {showDailyReward && (
            <DailyReward onClose={() => setShowDailyReward(false)} />
          )}

          {/* BEP20 Address Modal */}
          {showBEP20Modal && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
              {/* Modal Background */}
              <div className="absolute inset-0 bg-black opacity-70"></div>

              {/* Modal Content */}
              <div className="relative bg-black text-white p-6 rounded-lg w-11/12 max-w-md">
                <h2 className="text-xl font-bold mb-4 text-white text-center">
                  Paste your BEP20 address
                </h2>
                <input
                  type="text"
                  value={bep20Address}
                  onChange={(e) => setBep20Address(e.target.value)}
                  placeholder="Enter BEP20 address"
                  className="w-full p-2 rounded bg-gray-700 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <button
                  onClick={handleBEP20Submit}
                  className="w-full h-12 bg-[#0075d9] text-black font-bold rounded-full shadow-md hover:bg-yellow-400 transition-colors duration-300"
                >
                  OK
                </button>
              </div>
            </div>
          )}

          {/* Modal for Alerts */}
          {modalMessage && (
            <Modal message={modalMessage} onClose={closeModal} />
          )}
          <Toaster />
        </>
      )}
    </div>
  );
};

export default App;
