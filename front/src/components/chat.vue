<template>
  <div class="chat">
    <ul>
      <li v-for="(message, index) in chatHistory" :key="index">
        <span class="user">{{ message.tags["display-name"] }}</span
        ><span class="message">{{ message.message }}</span>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "chat",
  props: {
    socket: {
      required: true,
      type: Object,
    },
  },
  data() {
    return {
      chatHistory: null,
    };
  },
  mounted() {
    this.socket.instance.on("history", (chatHistory) => {
      this.chatHistory = chatHistory
        .filter((item) => {
          return item.channel === "#askowbol";
        })
        .slice(-4);
      console.log("Received chat history:", chatHistory);
    });
  },
};
</script>

<style scoped lang="scss">
.chat {
  position: absolute;
  display: flex;
  padding: 25px;
  bottom: 0;
  right: 0;

  ul {
    li {
      position: relative;
      list-style: none;
      margin-bottom: 35px;

      .user {
        position: absolute;
        display: block;
        top: -14px;
        left: 0;
        font-weight: bold;
        background: white;
        padding: 7px 15px;
        border-radius: 20px;
      }

      .message {
        display: block;
        background: #efefef;
        padding: 35px 12px 13px 30px;
        border-radius: 19px;
        max-width: 320px;
        min-width: 320px;
      }
    }
  }
}
</style>
