<template>
  <div class="chat">
    <TransitionGroup name="list" tag="ul">
      <li v-for="(item, index) in chatHistory" :key="index">
        <span class="user">{{ item.tags["display-name"] }}</span
        ><span class="message">{{ item.message }}</span>
      </li>
    </TransitionGroup>
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
      chatHistory: [],
    };
  },
  mounted() {
    this.socket.instance.on("history", (chatHistory) => {
      this.chatHistory = chatHistory
        .filter((item) => {
          return item.channel === "#askowbol";
        })
        .slice(-1);
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
        top: -15px;
        left: 0;
        font-weight: bold;
        background: white;
        padding: 7px 15px;
        border-radius: 20px;
      }

      .message {
        display: block;
        background: #efefef;
        padding: 35px 12px 13px 20px;
        border-radius: 10px 20px 20px 20px;
        max-width: 320px;
        min-width: 320px;
      }
    }
  }

  .list-move,
  .list-enter-active,
  .list-leave-active {
    transition: all 0.5s ease;
  }

  .list-enter-from {
    opacity: 0;
    transform: translateX(30px);
  }

  .list-leave-to {
    opacity: 0;
    transform: translateY(-130px);
  }

  /* ensure leaving items are taken out of layout flow so that moving
   animations can be calculated correctly. */
  .list-leave-active {
    position: absolute;
  }
}
</style>
