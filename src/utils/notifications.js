import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function scheduleTestNotificationAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permission was not granted.');
    return null;
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'cozyhumansclub test',
      body: 'Local notifications are working.',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
      channelId: Platform.OS === 'android' ? 'default' : undefined,
    },
  });
}

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('푸시 알림 권한을 얻지 못했습니다!');
      return null;
    }
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
      // projectId가 없으면 에러가 날 수 있으므로 예외처리 추가
      if (!projectId) {
         console.log('Project ID not found in app.json. Cannot get push token.');
         return null;
      }

      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      
      // Expo 토큰 대신 기기 디바이스 FCM/APNs 토큰을 원할 경우 getDevicePushTokenAsync() 사용 가능. 
      // 백엔드가 Expo SDK를 쓴다면 Expo Push Token을, Firebase SDK를 직접 쓴다면 Device Token을 씁니다.
      // 일단 getDevicePushTokenAsync로 FCM 토큰을 가져오겠습니다. (사용자가 fcm token이라고 명시했으므로)
      const devicePushToken = (await Notifications.getDevicePushTokenAsync()).data;
      
      console.log('발급된 Expo Push Token:', pushTokenString);
      console.log('발급된 Device Push Token (FCM/APNs):', devicePushToken);
      
      return devicePushToken;
    } catch (e) {
      console.error('푸시 토큰 발급 중 오류 발생:', e);
      return null;
    }
  } else {
    console.log('푸시 알림은 실제 기기에서만 작동합니다. (에뮬레이터에서는 토큰 발급 안됨)');
    return null;
  }
}
