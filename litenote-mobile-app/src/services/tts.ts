/**
 * TTS 语音播报服务
 * 在记账和结算成功后提供语音反馈
 * 使用 react-native-tts 库（Android/iOS）
 */
import { Platform } from 'react-native';

class TTSService {
  private isAvailable: boolean = false;
  private isInitialized: boolean = false;

  /**
   * 初始化 TTS 服务
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.isAvailable = Platform.OS === 'android' || Platform.OS === 'ios';

      if (this.isAvailable) {
        const { default: Tts } = require('react-native-tts');
        await Tts.setDefaultLanguage('zh-CN');
        await Tts.setDefaultRate(0.6);
        await Tts.setDefaultPitch(1.0);
      }

      this.isInitialized = true;
    } catch (error) {
      console.warn('TTS init failed:', error);
      this.isAvailable = false;
      this.isInitialized = true;
    }
  }

  /**
   * 播报文本
   */
  async speak(text: string): Promise<void> {
    if (!this.isAvailable) return;

    try {
      await this.init();
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        const { default: Tts } = require('react-native-tts');
        await Tts.stop();
        await Tts.speak(text);
      }
    } catch (error) {
      console.warn('TTS not available:', error);
    }
  }

  /**
   * 播报记账结果
   */
  async speakBillResult(bill: {
    amount: number;
    type: string;
    description?: string;
    customerName?: string;
  }): Promise<void> {
    let text = '';
    if (bill.type === 'credit') {
      text = `赊账成功，${bill.customerName || '客户'}赊账${bill.amount}元`;
    } else if (bill.type === 'income') {
      text = `回款成功，收到${bill.amount}元`;
    } else {
      text = `记账成功，支出${bill.amount}元`;
    }
    if (bill.description) {
      text += `，${bill.description}`;
    }
    await this.speak(text);
  }

  /**
   * 播报批量结算结果
   */
  async speakSettleResult(totalAmount: number, count: number): Promise<void> {
    const text = `结算成功，共结清${count}笔赊账，合计${totalAmount}元`;
    await this.speak(text);
  }

  /**
   * 停止播报
   */
  async stop(): Promise<void> {
    try {
      if (this.isAvailable && (Platform.OS === 'android' || Platform.OS === 'ios')) {
        const { default: Tts } = require('react-native-tts');
        await Tts.stop();
      }
    } catch (error) {
      console.warn('TTS stop failed:', error);
    }
  }
}

export const ttsService = new TTSService();