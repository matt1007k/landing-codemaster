<script setup lang="ts">
import { ref, onMounted, computed, defineProps, onUnmounted } from "vue";
import io from "socket.io-client";

type Props = {
  title: string;
};

const { title } = defineProps<Props>();

// reactive state
const count = ref(0);

// functions that mutate state and trigger updates
function increment() {
  count.value++;
  updateSearchParams("count", count.value.toString()); // Update the query param
}

function reset() {
  removeSearchParams("count");
  count.value = 0;
}

const messageList = ref<string[]>(["Hwo are you?", "I am fine", "And you?"]);
const textInput = ref<string>("");

const updateSearchParams = (key: string, value: string) => {
  const url = new URL(window.location.toString());
  url.searchParams.set(key, value); // Update the query param
  window.history.pushState({}, "", url);
};

const removeSearchParams = (key: string) => {
  const url = new URL(window.location.toString());
  url.searchParams.delete(key); // Remove the query param
  window.history.pushState({}, "", url);
};

const socket = io("ws://localhost:8080");

// lifecycle hooks
onMounted(() => {
  count.value = Number(
    new URLSearchParams(window.location.search).get("count")
  );

  console.log(`The initial count is ${count.value}.`);

  socket.on("connect", () => {
    console.log("Connected to server");
    socket.emit("join", "room");
  });

  socket.on("message", (data) => {
    console.log("Received message:", data);
  });

  socket.on("join_user", (user) => {
    console.log("join_user:", user);
  });

  socket.on("sendMessage", (data: { message: string }) => {
    console.log("Received chat message:", data.message);
    // messageList.value.push(message);
    messageList.value = [...messageList.value, data.message];
    window.scrollTo(0, document.body.scrollHeight);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from server");
  });
});

const joinUser = () => {
  socket.emit("join", count.value.toString());
};

const sendMessage = () => {
  socket.emit("sendMessage", { message: textInput.value });
  textInput.value = "";
};

const isDisabled = computed(() => count.value === 0);

onUnmounted(() => {
  // Clean up event listeners to prevent memory leaks
  socket.off("connect");
  socket.off("disconnect");
  socket.off("message");
  socket.disconnect(); // Disconnect when the component is unmounted
});
</script>

<template>
  <h1>{{ title }}</h1>
  <button
    @click="increment"
    class="px-4 py-2 h-14 rounded-lg bg-indigo-500 text-white font-medium"
  >
    Count is: {{ count }}
  </button>

  <button
    class="px-4 py-2 h-14 rounded-lg bg-gray-100 text-black font-medium disabled:bg-gray-400 cursor-not-allowed"
    @click="reset"
    :disabled="isDisabled"
  >
    Reset
  </button>
  <button
    class="px-4 py-2 h-14 rounded-lg bg-gray-100 text-black font-medium disabled:bg-gray-400 cursor-not-allowed"
    @click="joinUser"
  >
    Join
  </button>

  <div>
    <ul>
      <li v-for="message in messageList" :key="message">
        {{ message }}
      </li>
    </ul>
    <input type="text" placeholder="Type a message" v-model="textInput" />
    <button @click="sendMessage">Send</button>
  </div>
</template>
