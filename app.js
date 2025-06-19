// app.js 

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, query, where, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Firebase設定（自分のプロジェクトに合わせて変更）
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();
const provider = new GoogleAuthProvider();

loginBtn.onclick = () => signInWithPopup(auth, provider);
logoutBtn.onclick = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "block";
    userName.innerText = `${user.displayName}さん`;
    window.currentUser = user;
    loadLogs();
  } else {
    loginBtn.style.display = "block";
    logoutBtn.style.display = "none";
    userName.innerText = "";
    window.currentUser = null;
  }
});

// 瞑想スタートボタン処理
startBtn.onclick = () => {
  document.getElementById("meditationScreen").style.display = "block";
  diarySection.style.display = "none";
  meditationAudio.play();

  meditationAudio.onended = () => {
    document.getElementById("meditationScreen").style.display = "none";
    diarySection.style.display = "block";
  };
};

// 瞑想なしですぐに日記入力
skipToDiaryBtn.onclick = () => {
  document.getElementById("meditationScreen").style.display = "none";
  diarySection.style.display = "block";
};

// ChatGPTへの送信と保存
submitBtn.onclick = async () => {
  const diary = document.getElementById("diary").value;
  const responseDiv = document.getElementById("response");
  const responseSection = document.getElementById("responseSection");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer YOUR_OPENAI_API_KEY`,//自分のAPIキーをコピーする
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "あなたは『自分にやさしくする習慣』をサポートする存在です。ユーザーの気づきや感情を否定せず、そっと寄り添うような、やさしいことばで返してください。"
        },
        {
          role: "user",
          content: `今日の気持ち: ${diary}`
        }
      ]
    })
  });

  const data = await res.json();
  const reply = data.choices[0].message.content;
  responseDiv.innerText = reply;
  responseSection.style.display = "block";

  if (window.currentUser) {
    await addDoc(collection(db, "yasashii_logs"), {
      timestamp: new Date(),
      diary: diary,
      reply: reply,
      uid: window.currentUser.uid
    });
    loadLogs();
  }
};

// Firestoreから記録を取得
async function loadLogs() {
  if (!window.currentUser) return;

  const q = query(
    collection(db, "yasashii_logs"),
    where("uid", "==", window.currentUser.uid),
    orderBy("timestamp", "desc")
  );

  const snapshot = await getDocs(q);
  const logList = document.getElementById("logList");
  logList.innerHTML = "";

  snapshot.forEach((doc) => {
    const data = doc.data();
    const item = document.createElement("div");
    item.innerHTML = `
      <p><strong>📝 ${data.diary}</strong></p>
      <p style="color:gray;">日付: ${new Date(data.timestamp.toDate()).toLocaleString()}</p>
      <p>💬 ${data.reply}</p>
      <hr>
    `;
    logList.appendChild(item);
  });
}
