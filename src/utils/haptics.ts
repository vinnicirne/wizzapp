import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export const triggerNativeNudge = async () => {
  if (Capacitor.isNativePlatform()) {
    await Haptics.vibrate({ duration: 1000 });
  }
};

export const triggerNativeKnock = async () => {
  if (Capacitor.isNativePlatform()) {
    await Haptics.impact({ style: ImpactStyle.Heavy });
    setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 200);
    setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 400);
  }
};

/** Shake Screen — intense repeated impact burst mimicking the screen shake effect */
export const triggerNativeShake = async () => {
  if (Capacitor.isNativePlatform()) {
    const delays = [0, 80, 160, 240, 320, 400, 480, 560];
    delays.forEach(d =>
      setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), d)
    );
  }
};
