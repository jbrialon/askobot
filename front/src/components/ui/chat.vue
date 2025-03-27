<template>
  <div class="chat">
    <TransitionGroup name="list" tag="ul">
      <li v-for="(item, index) in chatHistory" :key="index">
        <div class="user">
          <div
            class="avatar"
            v-if="item.tags['display-name'] === 'Askowbot'"
          ></div>
          <div class="name" :style="{ color: item.tags.color }">
            {{ item.tags["display-name"] }}
          </div>
        </div>
        <div class="message">
          <template v-for="(message, index) in item.parsedMessage" :key="index">
            <template v-if="message.type === 'text'">
              {{ message.value }}
            </template>
            <template v-else-if="message.type === 'emote'">
              <img class="emote" :src="message.src" />
            </template>
          </template>
        </div>
      </li>
    </TransitionGroup>
  </div>
</template>

<script>
import { getEmoteAsUrl, parseEmotesInMessage } from "tmi-utils";

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
        .filter((item) => item.channel === "#askowbol")
        .map((item) => ({
          ...item,
          parsedMessage: parseEmotesInMessage(
            item.tags.emotes,
            item.message,
          ).map((message, index, arr) => {
            if (message.type === "text") {
              let value = message.value;
              if (index === 0) value = value.replace(/^🤖\s*/, "");
              if (index === arr.length - 1) value = value.replace(/\s*🤖$/, "");
              return { ...message, value };
            }
            return {
              ...message,
              ...(message.type === "emote" && {
                src: getEmoteAsUrl(message.value),
              }),
            };
          }),
        }))
        .slice(-4);
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
        display: flex;
        top: -15px;
        left: 0;
        font-weight: bold;
        background: white;
        padding: 2px 15px 2px 2px;
        border-radius: 20px;
        flex-direction: row;
      }

      .name {
        margin-left: 14px;
        line-height: 34px;
      }

      .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid lightgray;
        background-color: lightgray;
        position: relative;

        &:after {
          position: absolute;
          display: block;
          margin: auto;
          content: "🤖";
          font-size: 16px;
          top: calc(50% - 1px);
          left: 50%;
          transform: translate(-50%, -50%);
        }
      }

      .emote {
        height: 20px;
        display: inline-block;
        margin: 0 5px;
      }

      .message {
        display: flex;
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
