import "server-only";

import { logger } from "@/lib/logger";
import {
  answerTelegramCallbackQuery,
  buildContactKeyboard,
  buildInlineKeyboard,
  sendTelegramMessage,
} from "@/lib/telegram/client";
import {
  createLeadRecord,
  createOrderRecord,
  extractMessageText,
  extractPhoneNumber,
  getPublishedFlowTree,
  logInteraction,
  parseSessionState,
  upsertBotUserFromTelegram,
  updateBotUserRuntimeState,
} from "@/server/repositories/interactions";
import type { BotSessionState, FlowNodeWithButtons } from "@/types/app";
import type { TelegramUpdate } from "@/types/telegram";

type ProcessUpdateInput = {
  botId: string;
  workspaceId: string;
  token: string;
  update: TelegramUpdate;
};

function findNode(nodes: FlowNodeWithButtons[], nodeId?: string | null) {
  return nodes.find((node) => node.id === nodeId) ?? null;
}

async function enterNode(input: {
  botId: string;
  workspaceId: string;
  token: string;
  botUserId: string;
  chatId: string;
  node: FlowNodeWithButtons;
  nodes: FlowNodeWithButtons[];
  depth?: number;
}) {
  const depth = input.depth ?? 0;

  if (depth > 4) {
    return;
  }

  const node = input.node;
  const buttons =
    node.type === "external_link" && node.parsedConfig.url
      ? [
          {
            text: node.parsedConfig.buttonLabel || "Batafsil ochish",
            url: node.parsedConfig.url,
          },
        ]
      : node.buttons.map((button) => ({
          text: button.label,
          callbackData: button.target_node_id ? `goto:${button.target_node_id}` : undefined,
          url: button.url ?? undefined,
        }));

  if (node.type === "lead_capture") {
    await sendTelegramMessage(input.token, {
      chat_id: input.chatId,
      text: node.content,
    });

    await updateBotUserRuntimeState({
      botUserId: input.botUserId,
      currentNodeId: node.id,
      sessionState: {
        pendingAction: "lead_capture_name",
        nodeId: node.id,
      },
    });

    await logInteraction({
      workspaceId: input.workspaceId,
      botId: input.botId,
      botUserId: input.botUserId,
      flowNodeId: node.id,
      direction: "outgoing",
      eventType: "message",
      messageText: node.content,
    });
    return;
  }

  if (node.type === "order_form") {
    await sendTelegramMessage(input.token, {
      chat_id: input.chatId,
      text: node.content,
    });

    await updateBotUserRuntimeState({
      botUserId: input.botUserId,
      currentNodeId: node.id,
      sessionState: {
        pendingAction: "order_form_name",
        nodeId: node.id,
        order: {
          productName: node.parsedConfig.productName || node.title,
        },
      },
    });

    await logInteraction({
      workspaceId: input.workspaceId,
      botId: input.botId,
      botUserId: input.botUserId,
      flowNodeId: node.id,
      direction: "outgoing",
      eventType: "message",
      messageText: node.content,
    });
    return;
  }

  await sendTelegramMessage(input.token, {
    chat_id: input.chatId,
    text: node.content,
    reply_markup: buttons.length ? buildInlineKeyboard(buttons) : undefined,
  });

  await updateBotUserRuntimeState({
    botUserId: input.botUserId,
    currentNodeId: node.id,
    sessionState: null,
  });

  await logInteraction({
    workspaceId: input.workspaceId,
    botId: input.botId,
    botUserId: input.botUserId,
    flowNodeId: node.id,
    direction: "outgoing",
    eventType: "message",
    messageText: node.content,
  });

  if (!buttons.length && node.parsedConfig.nextNodeId) {
    const nextNode = findNode(input.nodes, node.parsedConfig.nextNodeId);

    if (nextNode) {
      await enterNode({
        ...input,
        node: nextNode,
        depth: depth + 1,
      });
    }
  }
}

async function handleLeadSession(input: {
  botId: string;
  workspaceId: string;
  token: string;
  botUserId: string;
  chatId: string;
  session: BotSessionState;
  node: FlowNodeWithButtons;
  nodes: FlowNodeWithButtons[];
  update: TelegramUpdate;
}) {
  const message = input.update.message;

  if (!message) {
    return;
  }

  if (input.session.pendingAction === "lead_capture_name") {
    const fullName = extractMessageText(message);

    if (!fullName) {
      await sendTelegramMessage(input.token, {
        chat_id: input.chatId,
        text: "Iltimos, to'liq ismingizni matn ko'rinishida yuboring.",
      });
      return;
    }

    await updateBotUserRuntimeState({
      botUserId: input.botUserId,
      currentNodeId: input.node.id,
      sessionState: {
        pendingAction: "lead_capture_phone",
        nodeId: input.node.id,
        lead: {
          fullName,
        },
      },
    });

    await sendTelegramMessage(input.token, {
      chat_id: input.chatId,
      text: "Endi telefon raqamingizni yuboring.",
      reply_markup: buildContactKeyboard(),
    });
    return;
  }

  if (input.session.pendingAction === "lead_capture_phone") {
    const phone = extractPhoneNumber(message);
    const fullName = input.session.lead?.fullName;

    if (!phone || phone.length < 7 || !fullName) {
      await sendTelegramMessage(input.token, {
        chat_id: input.chatId,
        text: "Telefon raqamni to'g'ri yuboring yoki kontakt share qiling.",
      });
      return;
    }

    await createLeadRecord({
      workspaceId: input.workspaceId,
      botId: input.botId,
      botUserId: input.botUserId,
      flowNodeId: input.node.id,
      fullName,
      phone,
    });

    await updateBotUserRuntimeState({
      botUserId: input.botUserId,
      currentNodeId: input.node.id,
      sessionState: null,
      phone,
    });

    await logInteraction({
      workspaceId: input.workspaceId,
      botId: input.botId,
      botUserId: input.botUserId,
      flowNodeId: input.node.id,
      direction: "system",
      eventType: "lead_captured",
      messageText: `${fullName} / ${phone}`,
    });

    await sendTelegramMessage(input.token, {
      chat_id: input.chatId,
      text:
        input.node.parsedConfig.successMessage ||
        "Rahmat! Ma'lumotingiz saqlandi, operator tez orada bog'lanadi.",
    });

    const nextNode = findNode(input.nodes, input.node.parsedConfig.nextNodeId);
    if (nextNode) {
      await enterNode({
        botId: input.botId,
        workspaceId: input.workspaceId,
        token: input.token,
        botUserId: input.botUserId,
        chatId: input.chatId,
        node: nextNode,
        nodes: input.nodes,
      });
    }
  }
}

async function handleOrderSession(input: {
  botId: string;
  workspaceId: string;
  token: string;
  botUserId: string;
  chatId: string;
  session: BotSessionState;
  node: FlowNodeWithButtons;
  nodes: FlowNodeWithButtons[];
  update: TelegramUpdate;
}) {
  const message = input.update.message;

  if (!message) {
    return;
  }

  if (input.session.pendingAction === "order_form_name") {
    const customerName = extractMessageText(message);

    if (!customerName) {
      await sendTelegramMessage(input.token, {
        chat_id: input.chatId,
        text: "Buyurtma uchun ism kiriting.",
      });
      return;
    }

    await updateBotUserRuntimeState({
      botUserId: input.botUserId,
      currentNodeId: input.node.id,
      sessionState: {
        pendingAction: "order_form_phone",
        nodeId: input.node.id,
        order: {
          productName:
            input.session.order?.productName ||
            input.node.parsedConfig.productName ||
            input.node.title,
          customerName,
        },
      },
    });

    await sendTelegramMessage(input.token, {
      chat_id: input.chatId,
      text: "Telefon raqamingizni yuboring.",
      reply_markup: buildContactKeyboard(),
    });
    return;
  }

  if (input.session.pendingAction === "order_form_phone") {
    const phone = extractPhoneNumber(message);

    if (!phone || phone.length < 7) {
      await sendTelegramMessage(input.token, {
        chat_id: input.chatId,
        text: "Telefon raqamni to'g'ri yuboring.",
      });
      return;
    }

    await updateBotUserRuntimeState({
      botUserId: input.botUserId,
      currentNodeId: input.node.id,
      phone,
      sessionState: {
        pendingAction: "order_form_note",
        nodeId: input.node.id,
        order: {
          productName:
            input.session.order?.productName ||
            input.node.parsedConfig.productName ||
            input.node.title,
          customerName: input.session.order?.customerName,
          phone,
        },
      },
    });

    await sendTelegramMessage(input.token, {
      chat_id: input.chatId,
      text: "Qo'shimcha izohingiz bo'lsa yuboring. Bo'lmasa `-` deb yozing.",
    });
    return;
  }

  if (input.session.pendingAction === "order_form_note") {
    const note = extractMessageText(message);
    const order = input.session.order;

    if (!order?.customerName || !order.phone) {
      await sendTelegramMessage(input.token, {
        chat_id: input.chatId,
        text: "Buyurtma sessioni topilmadi. Iltimos, qayta urinib ko'ring.",
      });
      return;
    }

    await createOrderRecord({
      workspaceId: input.workspaceId,
      botId: input.botId,
      botUserId: input.botUserId,
      flowNodeId: input.node.id,
      productName: order.productName || input.node.title,
      customerName: order.customerName,
      phone: order.phone,
      note: note === "-" ? null : note,
    });

    await updateBotUserRuntimeState({
      botUserId: input.botUserId,
      currentNodeId: input.node.id,
      sessionState: null,
    });

    await logInteraction({
      workspaceId: input.workspaceId,
      botId: input.botId,
      botUserId: input.botUserId,
      flowNodeId: input.node.id,
      direction: "system",
      eventType: "order_captured",
      messageText: order.productName || input.node.title,
    });

    await sendTelegramMessage(input.token, {
      chat_id: input.chatId,
      text:
        input.node.parsedConfig.successMessage ||
        "Buyurtmangiz qabul qilindi. Tez orada siz bilan bog'lanamiz.",
    });

    const nextNode = findNode(input.nodes, input.node.parsedConfig.nextNodeId);
    if (nextNode) {
      await enterNode({
        botId: input.botId,
        workspaceId: input.workspaceId,
        token: input.token,
        botUserId: input.botUserId,
        chatId: input.chatId,
        node: nextNode,
        nodes: input.nodes,
      });
    }
  }
}

export async function processTelegramUpdate(input: ProcessUpdateInput) {
  const flow = await getPublishedFlowTree(input.botId);
  const message = input.update.message;
  const callback = input.update.callback_query;
  const sourceMessage = message ?? callback?.message;

  if (!sourceMessage) {
    logger.warn("telegram.webhook_no_message", {
      botId: input.botId,
      updateId: input.update.update_id,
    });
    return;
  }

  const telegramUser = message?.from ?? callback?.from;

  if (!telegramUser) {
    return;
  }

  const botUser = await upsertBotUserFromTelegram({
    workspaceId: input.workspaceId,
    botId: input.botId,
    chatId: String(sourceMessage.chat.id),
    telegramUser,
    phone: message?.contact?.phone_number ?? null,
  });

  const currentSession = parseSessionState(botUser.session_state);

  if (message) {
    await logInteraction({
      workspaceId: input.workspaceId,
      botId: input.botId,
      botUserId: botUser.id,
      flowNodeId: botUser.current_node_id,
      direction: "incoming",
      eventType: message.text === "/start" ? "start" : "message",
      messageText: message.text ?? message.contact?.phone_number ?? null,
    });
  }

  if (callback?.data) {
    await answerTelegramCallbackQuery(input.token, callback.id);

    await logInteraction({
      workspaceId: input.workspaceId,
      botId: input.botId,
      botUserId: botUser.id,
      flowNodeId: botUser.current_node_id,
      direction: "incoming",
      eventType: "callback",
      messageText: callback.data,
    });

    if (callback.data.startsWith("goto:")) {
      const targetNode = findNode(flow.nodes, callback.data.replace("goto:", ""));

      if (targetNode) {
        await enterNode({
          botId: input.botId,
          workspaceId: input.workspaceId,
          token: input.token,
          botUserId: botUser.id,
          chatId: String(sourceMessage.chat.id),
          node: targetNode,
          nodes: flow.nodes,
        });
      }
    }

    return;
  }

  if (!message) {
    return;
  }

  if (message.text === "/start") {
    if (!flow.startNode) {
      return;
    }

    await enterNode({
      botId: input.botId,
      workspaceId: input.workspaceId,
      token: input.token,
      botUserId: botUser.id,
      chatId: String(sourceMessage.chat.id),
      node: flow.startNode,
      nodes: flow.nodes,
    });
    return;
  }

  const currentNode = findNode(flow.nodes, currentSession.nodeId ?? botUser.current_node_id);

  if (currentNode?.type === "lead_capture" && currentSession.pendingAction) {
    await handleLeadSession({
      botId: input.botId,
      workspaceId: input.workspaceId,
      token: input.token,
      botUserId: botUser.id,
      chatId: String(sourceMessage.chat.id),
      session: currentSession,
      node: currentNode,
      nodes: flow.nodes,
      update: input.update,
    });
    return;
  }

  if (currentNode?.type === "order_form" && currentSession.pendingAction) {
    await handleOrderSession({
      botId: input.botId,
      workspaceId: input.workspaceId,
      token: input.token,
      botUserId: botUser.id,
      chatId: String(sourceMessage.chat.id),
      session: currentSession,
      node: currentNode,
      nodes: flow.nodes,
      update: input.update,
    });
    return;
  }

  if (flow.startNode) {
    await enterNode({
      botId: input.botId,
      workspaceId: input.workspaceId,
      token: input.token,
      botUserId: botUser.id,
      chatId: String(sourceMessage.chat.id),
      node: flow.startNode,
      nodes: flow.nodes,
    });
  }
}
