/*************************************************
 * 🔹 Firebase Configuration
 *************************************************/
const firebaseConfig = {
  apiKey: "AIzaSyAZhuNWFUQH-Wj4J44SlIs116q2cce-Pnc",
  authDomain: "smart-flow-water-monitor.firebaseapp.com",
  databaseURL: "https://smart-flow-water-monitor-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-flow-water-monitor",
  storageBucket: "smart-flow-water-monitor.firebasestorage.app",
  messagingSenderId: "244582964526",
  appId: "1:244582964526:web:b3994012e6eba99b08aebf"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/*************************************************
 * 🔹 Firebase References
 *************************************************/
const flowRef = db.ref("flow");
const valveRef = db.ref("valve/state");

/*************************************************
 * 🔹 Chart Data Arrays
 *************************************************/
let timeLabels = [];
let flow1Data = [];
let flow2Data = [];
let flow3Data = [];

/*************************************************
 * 🔹 Line Chart (Flow over Time)
 *************************************************/
const lineChart = new Chart(document.getElementById("lineChart"), {
  type: "line",
  data: {
    labels: timeLabels,
    datasets: [
      {
        label: "Flow 1",
        data: flow1Data,
        borderColor: "#1e88e5",
        tension: 0.4
      },
      {
        label: "Flow 2",
        data: flow2Data,
        borderColor: "#43a047",
        tension: 0.4
      },
      {
        label: "Flow 3",
        data: flow3Data,
        borderColor: "#e53935",
        tension: 0.4
      }
    ]
  },
  options: {
    responsive: true,
    animation: true
  }
});

/*************************************************
 * 🔹 Bar Chart (Current Flow Comparison)
 *************************************************/
const barChart = new Chart(document.getElementById("barChart"), {
  type: "bar",
  data: {
    labels: ["Flow 1", "Flow 2", "Flow 3"],
    datasets: [
      {
        label: "Current Flow (L/min)",
        data: [0, 0, 0],
        backgroundColor: ["#1e88e5", "#43a047", "#e53935"]
      }
    ]
  },
  options: {
    responsive: true
  }
});

/*************************************************
 * 🔹 Live Flow Listener
 *************************************************/
flowRef.on("value", snapshot => {
  const data = snapshot.val();
  if (!data) return; // 🔒 Prevent null crash

  const f1 = Number(data.flow1) || 0;
  const f2 = Number(data.flow2) || 0;
  const f3 = Number(data.flow3) || 0;

  // Update UI values
  document.getElementById("flow1").innerText = f1;
  document.getElementById("flow2").innerText = f2;
  document.getElementById("flow3").innerText = f3;

  // Time label
  const time = new Date().toLocaleTimeString();

  timeLabels.push(time);
  flow1Data.push(f1);
  flow2Data.push(f2);
  flow3Data.push(f3);

  // Keep last 10 readings
  if (timeLabels.length > 10) {
    timeLabels.shift();
    flow1Data.shift();
    flow2Data.shift();
    flow3Data.shift();
  }

  lineChart.update();

  // Update bar chart
  barChart.data.datasets[0].data = [f1, f2, f3];
  barChart.update();

  /*************************************************
   * 🔹 Leak Detection Logic
   *************************************************/
  let leakDetected = false;

  if (f1 > 0 || f2 > 0 || f3 > 0) {
    const avg = (f1 + f2 + f3) / 3;
    leakDetected =
      Math.abs(f1 - avg) > 5 ||
      Math.abs(f2 - avg) > 5 ||
      Math.abs(f3 - avg) > 5;
  }

  const statusBox = document.getElementById("leakStatus");
  const alertBox = document.getElementById("alertBox");

  if (leakDetected) {
    statusBox.innerHTML = "🔴 Leakage Detected";
    statusBox.className = "status leak";
    alertBox.style.display = "block";
  } else {
    statusBox.innerHTML = "🟢 System Normal";
    statusBox.className = "status normal";
    alertBox.style.display = "none";
  }

  // Last update time
  document.getElementById("lastUpdate").innerText =
    "Last updated: " + new Date().toLocaleString();
});

/*************************************************
 * 🔹 Valve Control Function
 *************************************************/
function setValve(state) {
  valveRef.set(state);
}

/*************************************************
 * 🔹 Valve Status Listener
 *************************************************/
valveRef.on("value", snapshot => {
  const state = snapshot.val();
  document.getElementById("valveStatus").innerText =
    state === 1 ? "✅ OPEN" : "❌ CLOSED";
});