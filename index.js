const { AppRegistry, Platform } = require('react-native');

const playbackServiceFactory = () => require('./src/lib/tts/playbackService').PlaybackService;

if (Platform.OS === 'android') {
	AppRegistry.registerHeadlessTask('TrackPlayer', playbackServiceFactory);
} else if (Platform.OS === 'ios') {
	setImmediate(playbackServiceFactory());
} else if (Platform.OS === 'web') {
	playbackServiceFactory()();
}

require('expo-router/entry');
