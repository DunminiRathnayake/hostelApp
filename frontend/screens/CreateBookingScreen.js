// CreateBookingScreen.js
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Modal, FlatList, Platform } from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import API from "../services/api";
import { useRouter } from "expo-router";
import { colors, T } from "../theme";
import { Ionicons } from "@expo/vector-icons";

export default function CreateBookingScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    visitorName: "",
    phone: "",
    NIC: "",
    type: "student_visit",
    studentId: "",
    date: "",
    time: "",
    timeLabel: "",
  });
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(null);

  const timeSlots = [];
  for (let h = 8; h <= 20; h++) {
    const ampm = h < 12 ? 'AM' : (h === 12 ? 'PM' : 'PM');
    const hDisplay = h <= 12 ? (h === 0 ? 12 : h) : h - 12;
    const h24 = h.toString().padStart(2, '0');
    
    timeSlots.push({ id: `${h24}:00`, label: `${hDisplay}:00 ${ampm}` });
    if (h !== 20) {
      timeSlots.push({ id: `${h24}:30`, label: `${hDisplay}:30 ${ampm}` });
    }
  }

  const openModal = (type) => {
    setModalType(type);
    setModalVisible(true);
  };

  // Load student list for dropdown (only for student visits)
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await API.get("/users/public/students");
        setStudents(Array.isArray(res.data) ? res.data : (res.data.students || []));
      } catch (e) {
        console.log("[CreateBooking] fetch students error", e);
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, []);

  const validate = () => {
    const { visitorName, phone, NIC, type, studentId, date, time } = form;
    if (!visitorName || !phone || !NIC || !date || !time) {
      Alert.alert("Validation", "All fields are required");
      return false;
    }
    if (type === "student_visit" && !studentId) {
      Alert.alert("Validation", "Please select a student for your visit");
      return false;
    }
    
    // Strict Phone Validation: 10 digits starting with 0
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(phone)) {
      Alert.alert("Validation", "Visitor phone number must be exactly 10 digits starting with '0'.");
      return false;
    }

    // Strict NIC Validation: 
    // Old (9 digits + V) OR New (12 digits)
    const nicRegex = /^([0-9]{9}[vV]|[0-9]{12})$/;
    if (!nicRegex.test(NIC)) {
      Alert.alert("Validation", "NIC format is invalid. Use 9 digits + 'V' or 12 digits.");
      return false;
    }
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate <= today) {
      Alert.alert("Validation", "Date must be a future date");
      return false;
    }
    
    return true;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        visitorName: form.visitorName,
        phone: form.phone,
        NIC: form.NIC,
        type: form.type,
        studentId: form.type === "student_visit" ? form.studentId : undefined,
        date: form.date,
        time: form.time,
      };
      await API.post("/bookings", payload);
      Alert.alert("Success", "Booking created successfully");
      router.replace("/(app)/(tabs)");
    } catch (e) {
      console.log(e);
      Alert.alert("Error", e.response?.data?.message || e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setForm({ ...form, date: `${year}-${month}-${day}` });
    }
  };

  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[T.title, { textAlign: "center" }]}>Create Booking</Text>
      <View style={[T.card, T.cardShadow]}>
        
        <Text style={T.label}>Type of Visit</Text>
        <View style={{ flexDirection: 'row', marginBottom: 15, marginTop: 5 }}>
          <TouchableOpacity 
            style={[styles.typeBtn, form.type === 'student_visit' && styles.typeBtnActive]}
            onPress={() => setForm({...form, type: 'student_visit'})}
          >
            <Text style={[styles.typeBtnText, form.type === 'student_visit' && styles.typeBtnTextActive]}>Student Visit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeBtn, form.type === 'room_visit' && styles.typeBtnActive]}
            onPress={() => setForm({...form, type: 'room_visit'})}
          >
            <Text style={[styles.typeBtnText, form.type === 'room_visit' && styles.typeBtnTextActive]}>Room Visit</Text>
          </TouchableOpacity>
        </View>

        <Text style={T.label}>Visitor Name</Text>
        <TextInput style={T.input} placeholder="John Doe" value={form.visitorName} onChangeText={t => setForm({ ...form, visitorName: t })} />
        <Text style={T.label}>Phone Number</Text>
        <TextInput style={T.input} placeholder="0712345678" keyboardType="phone-pad" maxLength={15} value={form.phone} onChangeText={t => setForm({ ...form, phone: t })} />
        <Text style={T.label}>NIC</Text>
        <TextInput style={T.input} placeholder="123456789V" value={form.NIC} onChangeText={t => setForm({ ...form, NIC: t })} />
        
        {form.type === "student_visit" && (
          <>
            <Text style={T.label}>Select Student</Text>
            {loadingStudents ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <View style={styles.pickerWrapper}>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => openModal('student')}>
                  <Text style={[styles.pickerText, !form.studentId && { color: colors.placeholder }]}>{
                    form.studentId ? students.find(s => s._id === form.studentId)?.name : "Select a student"
                  }</Text>
                  <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <Text style={T.label}>Date</Text>
        <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDatePicker(true)}>
          <Text style={[styles.pickerText, !form.date && { color: colors.placeholder }]}>{form.date || "Select Future Date"}</Text>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={{ marginBottom: 15 }} />
        {showDatePicker && (
          <DateTimePicker
            value={form.date ? new Date(form.date) : getTomorrowDate()}
            mode="date"
            display="default"
            minimumDate={getTomorrowDate()}
            onChange={onDateChange}
          />
        )}

        <Text style={T.label}>Time</Text>
        <TouchableOpacity style={styles.pickerBtn} onPress={() => openModal('time')}>
          <Text style={[styles.pickerText, !form.time && { color: colors.placeholder }]}>{form.timeLabel || "Select Time (8 AM - 8 PM)"}</Text>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={{ marginBottom: 15 }} />

        <TouchableOpacity style={[T.primaryBtn, submitting && styles.disabledBtn]} onPress={submit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={T.primaryBtnText}>Submit Booking</Text>}
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={[T.title, { marginBottom: 15, fontSize: 18, textAlign: 'center' }]}>
              {modalType === 'student' ? 'Select Student' : 'Select Time'}
            </Text>
            <FlatList
              data={modalType === 'student' ? students : timeSlots}
              keyExtractor={(item) => modalType === 'student' ? item._id : item.id}
              renderItem={({item}) => (
                <TouchableOpacity 
                  style={styles.modalItem}
                  onPress={() => {
                    if (modalType === 'student') {
                      setForm({...form, studentId: item._id});
                    } else {
                      setForm({...form, time: item.id, timeLabel: item.label});
                    }
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {modalType === 'student' ? item.name : item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={[T.primaryBtn, {marginTop: 15}]} onPress={() => setModalVisible(false)}>
              <Text style={T.primaryBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: colors.bg, flexGrow: 1 },
  pickerWrapper: { marginBottom: 18 },
  pickerBtn: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.input, padding: 12, borderRadius: 8 },
  pickerText: { fontSize: 14, color: colors.textPrimary, flex: 1 },
  disabledBtn: { opacity: 0.7 },
  typeBtn: { flex: 1, padding: 12, borderWidth: 1, borderColor: colors.primary, borderRadius: 8, marginHorizontal: 5, alignItems: 'center', backgroundColor: colors.surface },
  typeBtnActive: { backgroundColor: colors.primary },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  typeBtnTextActive: { color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', maxHeight: '75%', backgroundColor: colors.surface, borderRadius: 12, padding: 20 },
  modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalItemText: { fontSize: 16, color: colors.textPrimary, textAlign: 'center' },
});
