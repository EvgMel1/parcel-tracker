import React, {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { View, TouchableOpacity, StyleSheet, Animated, Text } from "react-native";
import { Plus } from "lucide-react-native";

type Props = {
  onPress: () => void;
  isActive?: boolean;
};

const AnimatedPlusButton = forwardRef(({ onPress, isActive = true }: Props, ref) => {
  const pulses = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  const buttonPulse = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const loopRefs = useRef<Animated.CompositeAnimation[]>([]);

  // управление видимостью кнопки
  useImperativeHandle(ref, () => ({
    hideButton: () => {
      Animated.timing(translateY, {
        toValue: 100,
        duration: 250,
        useNativeDriver: true,
      }).start();
    },
    showButton: () => {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    },
  }));

  const startWave = (anim: Animated.Value, delay: number) => {
    const duration = 3000;
    const totalCycle = duration + 1000;
    const wave = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration,
          useNativeDriver: false,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
        Animated.delay(totalCycle - delay - duration),
      ])
    );
    loopRefs.current.push(wave);
    wave.start();
  };

  useEffect(() => {
    loopRefs.current.forEach((loop) => loop.stop());
    loopRefs.current = [];

    if (!isActive) {
      pulses.forEach((p) => p.setValue(0));
      buttonPulse.setValue(0);
      return;
    }

    startWave(pulses[0], 0);
    startWave(pulses[1], 500);
    startWave(pulses[2], 1000);

    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonPulse, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnim.start();
    loopRefs.current.push(pulseAnim);

    return () => {
      loopRefs.current.forEach((loop) => loop.stop());
      loopRefs.current = [];
    };
  }, [isActive]);

  const createAnimatedStyle = (anim: Animated.Value, baseOpacity: number) => ({
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 4.2],
        }),
      },
    ],
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [baseOpacity, 0],
    }),
  });

  const buttonAnimatedStyle = {
    transform: [
      {
        scale: buttonPulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.08],
        }),
      },
      { translateY },
    ],
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      {pulses.map((p, i) => (
        <Animated.View
          key={i}
          style={[styles.pulseCircle, createAnimatedStyle(p, 0.4 - i * 0.1)]}
        />
      ))}

      <Animated.View style={[styles.buttonWrapper, buttonAnimatedStyle]}>
        <TouchableOpacity
          style={styles.button}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <Plus size={32} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
});

export default AnimatedPlusButton;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  buttonWrapper: {
    zIndex: 3,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#3b82f6",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 10,
  },
  pulseCircle: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 65,
    backgroundColor: "rgba(59,130,246,0.4)",
    zIndex: 1,
  },
});
