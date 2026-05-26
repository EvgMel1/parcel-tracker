import React, {
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import {
  View,
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  Pressable,
  useWindowDimensions,
  Easing,
  DeviceEventEmitter,
} from "react-native";
import { Trash2, CheckCircle2 } from "lucide-react-native";
import ConfirmModal from "./ConfirmModal";

export interface SwipeableCardHandle {
  triggerDelete: () => void;
}

interface SwipeableCardProps {
  trackingNumber: string;
  onDelete: () => void;
  onArchive?: () => void;
  onScrollLock?: (locked: boolean) => void;
  onSwipeToggle?: (open: boolean) => void; 
  archived?: boolean;
  children: React.ReactNode;
}

const SwipeableCard = forwardRef<SwipeableCardHandle, SwipeableCardProps>(
  ({ trackingNumber, onDelete, onArchive, archived,
    onScrollLock, onSwipeToggle, children }, ref) => {
    const { width } = useWindowDimensions();
    const translateX = useRef(new Animated.Value(0)).current;
    const fade = useRef(new Animated.Value(1)).current;
    const [confirmVisible, setConfirmVisible] = useState(false);
    const SWIPE_LIMIT = archived ? -80 : -160;

    const SWIPE_THRESHOLD = archived ? 80 : 160;
    const BUTTON_WIDTH = 80;
    const isOpen = useRef(false);
    const isSwiping = useRef(false);
    const directionLocked = useRef<"x" | "y" | null>(null);

    const animateTo = (toValue: number) => {
      Animated.spring(translateX, {
        toValue,
        useNativeDriver: true,
        friction: 18,
        tension: 140,
      }).start();
    };

    const close = () => {
      animateTo(0);
      isOpen.current = false;
      isSwiping.current = false;
      directionLocked.current = null;
      onSwipeToggle?.(false);
    };

    const open = () => {
      animateTo(-SWIPE_THRESHOLD);
      isOpen.current = true;
      isSwiping.current = false;
      onSwipeToggle?.(true);
      directionLocked.current = null;

     // 🛰️ уведомляем другие карточки, что эта открылась
      DeviceEventEmitter.emit("swipeOpen", trackingNumber);
    };

    const handleConfirmDelete = () => {
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -width,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDelete?.();
        setConfirmVisible(false);
      });
    };

    useImperativeHandle(ref, () => ({
      triggerDelete: () => handleConfirmDelete(),
    }));

     /** === Подписка на событие открытия другой карточки === */
    useEffect(() => {
  const sub1 = DeviceEventEmitter.addListener("swipeOpen", (id: string) => {
    if (id !== trackingNumber && isOpen.current) {
      close();
    }
  });

  const sub2 = DeviceEventEmitter.addListener("tapOutsideSwipe", () => {
    if (isOpen.current) close();
  });

  return () => {
    sub1.remove();
    sub2.remove();
  };
}, [trackingNumber]);

    const panResponder = useRef(
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => {
  const absDx = Math.abs(g.dx);
  const absDy = Math.abs(g.dy);

  // игнорируем совсем мелкие движения
  if (absDx < 6 && absDy < 6) return false;

  // горизонтальная активность → блокируем ScrollView
  if (absDx > absDy * 1.15) {
    onScrollLock?.(true);       // <— БЛОКИРУЕМ вертикальный скролл
    isSwiping.current = true;
    return true;
  }

  return false;
},

        onPanResponderGrant: () => {
          directionLocked.current = null;
        },

        onPanResponderMove: (_, g) => {
  if (directionLocked.current === "y") return;

  const absDx = Math.abs(g.dx);
  const absDy = Math.abs(g.dy);

  // Выбор направления
  if (!directionLocked.current) {
    // горизонтальный свайп — блокируем вертикальный scroll
    if (absDx > 8 && absDx > absDy * 1.3) {
      directionLocked.current = "x";
      onScrollLock?.(true);
      isSwiping.current = true;
    }
    // вертикальный свайп — разрешаем скролл списка
    else if (absDy > 10 && absDy > absDx * 1.2) {
      directionLocked.current = "y";
      onScrollLock?.(false);
      return;
    } else {
      // пока непонятно, в какую сторону — игнорим
      return;
    }
  }

  // Горизонтальное движение
  if (directionLocked.current === "x") {
    let newX = isOpen.current ? g.dx - SWIPE_THRESHOLD : g.dx;

    // Резина влево
    if (newX < -SWIPE_THRESHOLD) {
      const overflow = -SWIPE_THRESHOLD - newX;
      const resistance = 1 - Math.exp(-overflow / 40);
      newX = -SWIPE_THRESHOLD - resistance * 35;
    }

    // Резина вправо
    if (newX > 0) {
      const overflow = newX;
      const resistance = 1 - Math.exp(-overflow / 40);
      newX = resistance * 25;
    }

    translateX.setValue(newX);
  }
},

        onPanResponderRelease: (_, g) => {
          if (directionLocked.current === "y") return;

          // ⚙️ фильтрация вертикальной скорости
          const vy = Math.abs(g.vy);
          if (vy > 1.2) g.vy = 0; // при диагональном резком свайпе RN кидает vy≈2–3 → игнорируем

          const offsetX = isOpen.current ? g.dx - SWIPE_THRESHOLD : g.dx;
          const OPEN_THRESHOLD = -SWIPE_THRESHOLD * 0.45;
          const CLOSE_THRESHOLD = 40;

          if (isOpen.current && g.dx > CLOSE_THRESHOLD) {
            close();
          } else if (offsetX < OPEN_THRESHOLD) {
            open();
          } else {
            animateTo(isOpen.current ? -SWIPE_THRESHOLD : 0);
          }

          onScrollLock?.(false);
          isSwiping.current = false;
          directionLocked.current = null;
        },

        onPanResponderTerminate: (_, g) => {
          const absDx = Math.abs(g.dx);
          const absDy = Math.abs(g.dy);

          // ⚙️ Если движение преимущественно горизонтальное — не закрываем
          if (absDx > absDy * 1.1) {
            animateTo(isOpen.current ? -SWIPE_THRESHOLD : 0);
          } else {
            close();
          }

          onScrollLock?.(false);
          directionLocked.current = null;
          isSwiping.current = false;
        },

        // ⚙️ Не отдаём управление RN при диагоналях
        onPanResponderTerminationRequest: () => false,

        onShouldBlockNativeResponder: () => isSwiping.current,
      })
    ).current;

     /** === Движение кнопок вслед за карточкой === */
    const buttonTranslate = translateX.interpolate({
      inputRange: [SWIPE_LIMIT, 0],
      outputRange: archived 
  ? [0, BUTTON_WIDTH] 
  : [0, BUTTON_WIDTH * 2],
      extrapolate: "clamp",
    });

    const buttonOpacity = translateX.interpolate({
      inputRange: [SWIPE_LIMIT, -40, 0],
      outputRange: [1, 0.6, 0],
      extrapolate: "clamp",
    });

    return (
  <Animated.View style={[styles.root, { opacity: fade }]}>
    
    {/* ==== КНОПКИ ПОД СВАЙПОМ ==== */}
    <Animated.View
      style={[
        styles.actionsContainer,
        {
          transform: [{ translateX: buttonTranslate }],
          opacity: buttonOpacity,
        },
      ]}
    >
      {/* ==== КНОПКА "ARCHIVE" — только если НЕ архив ==== */}
      {!archived && (
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.action,
            { backgroundColor: "#3B82F6", width: BUTTON_WIDTH },
          ]}
          onPress={() => {
            onArchive?.();
            close();
          }}
        >
          <Text style={styles.actionText}>Archive</Text>
        </TouchableOpacity>
      )}

      {/* ==== DELETE — всегда ==== */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.action,
          { backgroundColor: "#EF4444", width: BUTTON_WIDTH },
        ]}
        onPress={() => setConfirmVisible(true)}
      >
        <Trash2 size={20} color="#fff" strokeWidth={1.6} />
        <Text style={styles.actionText}>Delete</Text>
      </TouchableOpacity>
    </Animated.View>

    {/* ==== САМА КАРТОЧКА ==== */}
    <Animated.View
      {...panResponder.panHandlers}
      style={[styles.card, { transform: [{ translateX }] }]}
    >
      <Pressable
        android_ripple={{ color: "rgba(255,255,255,0.08)" }}
        onPress={() => {
          if (isOpen.current) close();
        }}
      >
        {children}
      </Pressable>
    </Animated.View>

    {/* ==== МОДАЛКА ПРО УДАЛЕНИЕ ==== */}
    <ConfirmModal
      visible={confirmVisible}
      message={`Вы уверены, что хотите удалить посылку № ${trackingNumber}?`}
      onCancel={() => setConfirmVisible(false)}
      onConfirm={handleConfirmDelete}
    />
  </Animated.View>
);
})

export default SwipeableCard;

const styles = StyleSheet.create({
  root: {
    position: "relative",
    marginVertical: 2,
  },
  actionsContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    flexDirection: "row",
    overflow: "hidden",
  },
  
  action: {
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 3,
  },
  card: {
    backgroundColor: "#1A1A1A",
    overflow: "hidden",
  },
});
