import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Alert, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import API from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { colors, T } from "../theme";

const ROOM_TYPES = ["Single", "Double", "Triple", "Dormitory"];

export default function WardenCreateRoomScreen() {
  const router = useRouter();
  const [roomNumber, setRoomNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [roomType, setRoomType] = useState("Double");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchNextRoomNb = async () => {
      try {
        const res = await API.get("/rooms");
        const rooms = Array.isArray(res.data) ? res.data : (res.data.rooms || []);
        if (rooms.length > 0) {
          const numbers = rooms.map(r => parseInt(r.roomNumber)).filter(n => !isNaN(n));
          if (numbers.length > 0) {
            setRoomNumber((Math.max(...numbers) + 1).toString());
          } else {
            setRoomNumber("101");
          }
        } else {
          setRoomNumber("101");
        }
      } catch (e) {
        console.log("[CreateRoom] Error fetching rooms:", e.message);
      }
    };
    fetchNextRoomNb();
  }, []);

  const handleCreate = async () => {
    if (!roomNumber.trim()) return Alert.alert("Missing Info", "Please enter a room number.");
    if (!capacity || isNaN(parseInt(capacity)) || parseInt(capacity) < 1) {
      return Alert.alert("Invalid Capacity", "Please enter a valid capacity (e.g. 2).");
    }

    setIsSubmitting(true);
    try {
      await API.post("/rooms", {
        roomNumber: roomNumber.trim(),
        capacity: parseInt(capacity),
        type: roomType,
      });
      Alert.alert("Room Created!", `Room ${roomNumber} has been added successfully.`, [
        { text: "OK", onPress: () => router.back() }
      ]);
      setRoomNumber("");
      setCapacity("");
      setRoomType("Double");
    } catch (err) {
      const msg = err.response?.data?.message || "Could not create room. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[T.screen, styles.safeArea]}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[T.title, { marginTop: 0, marginBottom: 0 }]}>Create Room</Text>
        </View>

        <View style={[T.card, T.cardShadow, styles.card]}>
          <Text style={[T.label, styles.label]}>ROOM NUMBER</Text>
          <TextInput
            style={[T.input, styles.input]}
            placeholder="e.g. 101"
            placeholderTextColor={colors.placeholder}
            value={roomNumber}
            onChangeText={setRoomNumber}
            keyboardType="default"
          />

          <Text style={[T.label, styles.label]}>CAPACITY (STUDENTS)</Text>
          <TextInput
            style={[T.input, styles.input]}
            placeholder="e.g. 2"
            placeholderTextColor={colors.placeholder}
            value={capacity}
            onChangeText={setCapacity}
            keyboardType="numeric"
          />

          <Text style={[T.label, styles.label]}>ROOM TYPE</Text>
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={styles.dropdownHeader}
              onPress={() => setIsDropdownOpen(!isDropdownOpen)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownHeaderText}>{roomType}</Text>
              <Ionicons name={isDropdownOpen ? "chevron-up" : "chevron-down"} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            {isDropdownOpen && (
              <View style={styles.dropdownList}>
                {ROOM_TYPES.map((type, index) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.dropdownOption, index === ROOM_TYPES.length - 1 && { borderBottomWidth: 0 }]}
                    onPress={() => { setRoomType(type); setIsDropdownOpen(false); }}
                  >
                    <Text style={[styles.dropdownOptionText, roomType === type && styles.dropdownOptionTextActive]}>{type}</Text>
                    {roomType === type && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.previewCard}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} style={{ marginRight: 10 }} />
            <Text style={styles.previewText}>
              Room <Text style={{ fontWeight: "bold" }}>#{roomNumber || "—"}</Text> · {roomType} · {capacity || "—"} student{capacity === "1" ? "" : "s"}
            </Text>
          </View>

          <TouchableOpacity
            style={[T.primaryBtn, isSubmitting && styles.submitBtnDisabled]}
            onPress={handleCreate}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={T.primaryBtnText}>Create Room</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 20, paddingBottom: 40 },

  header: { flexDirection: "row", alignItems: "center", marginBottom: 24, marginTop: 10 },
  backBtn: { marginRight: 14, padding: 6 },

  card: { padding: 24 },

  label: { marginBottom: 8 },
  input: { marginBottom: 20 },

  dropdownContainer: { marginBottom: 20, zIndex: 10 },
  dropdownHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.input, padding: 14, borderRadius: 10 },
  dropdownHeaderText: { fontSize: 16, color: colors.textPrimary },
  dropdownList: { position: "absolute", top: 55, left: 0, right: 0, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 10, elevation: 10, zIndex: 999 },
  dropdownOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 15, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  dropdownOptionText: { fontSize: 16, color: colors.textPrimary },
  dropdownOptionTextActive: { color: colors.primary, fontWeight: "bold" },

  previewCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.primaryGlow, padding: 14, borderRadius: 10, marginBottom: 24 },
  previewText: { color: colors.primary, fontSize: 14, flex: 1 },

  submitBtnDisabled: { opacity: 0.7 },
});
