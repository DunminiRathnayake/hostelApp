import React, { useState, useEffect, useContext, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator } from "react-native";
import API from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { colors, T } from "../theme";

// ─── StarDisplay: defined outside to prevent remounting ──────────────────────
function StarDisplay({ score, interactive = false, onRate }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          disabled={!interactive}
          onPress={() => interactive && onRate?.(star)}
          style={interactive ? styles.starInteractive : styles.starStatic}
        >
          <Ionicons
            name={star <= score ? "star" : "star-outline"}
            size={interactive ? 36 : 16}
            color={star <= score ? colors.warning : colors.placeholder}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── ReviewForm: owns its own state so typing never re-renders the parent ─────
function ReviewForm({ onSubmitted }) {
  const [rating,       setRating]       = useState(0);
  const [comment,      setComment]      = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if (rating < 1 || rating > 5) return Alert.alert("Hold on!", "Please select a star rating first.");
    if (!comment.trim()) return Alert.alert("Hold on!", "Please share a few words about your experience.");
    setIsSubmitting(true);
    try {
      await API.post("/reviews", { rating, comment });
      Alert.alert("Thank You!", "Your review has been successfully posted.");
      setRating(0);
      setComment("");
      onSubmitted();
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[T.card, T.cardShadow]}>
      <Text style={[T.title, { fontSize: 20, marginTop: 0 }]}>Write a Review</Text>

      <Text style={T.label}>TAP TO RATE</Text>
      <View style={styles.interactiveStarBlock}>
        <StarDisplay score={rating} interactive onRate={setRating} />
      </View>

      <Text style={T.label}>YOUR THOUGHTS</Text>
      <TextInput
        style={[T.input, styles.textArea]}
        placeholder="What did you like or dislike?"
        placeholderTextColor={colors.placeholder}
        value={comment}
        onChangeText={setComment}
        multiline
      />

      <TouchableOpacity
        style={[T.primaryBtn, isSubmitting && styles.submitBtnDisabled]}
        onPress={submit}
        disabled={isSubmitting}
      >
        <Ionicons name="chatbox-ellipses" size={18} color="#fff" style={{ marginRight: 8 }} />
        <Text style={T.primaryBtnText}>{isSubmitting ? "Submitting..." : "Submit Review"}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ReviewScreen() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    try {
      const res = await API.get("/reviews");
      setReviews(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async (id) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this review?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await API.delete(`/reviews/${id}`);
            Alert.alert("Success", "Review deleted");
            fetchReviews();
          } catch (err) {
            Alert.alert("Error", "Could not delete review.");
          }
        }
      }
    ]);
  };

  const average = reviews.length
    ? (reviews.reduce((a, c) => a + c.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <SafeAreaView style={[T.screen, styles.safeArea]}>
      {/* ScrollView: no FlatList touch conflicts with TextInput */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerBlock}>
          <Text style={T.title}>Rate Our Hostel</Text>
          <Text style={T.subtitle}>Share your experience to help us improve.</Text>
        </View>

        {/* Average rating card */}
        <View style={[T.card, T.cardShadow, styles.avgContainer]}>
          <View style={styles.avgCircle}>
            <Text style={styles.avgNumber}>{average}</Text>
            <Text style={styles.avgLabel}>/ 5</Text>
          </View>
          <View style={styles.avgDetails}>
            <StarDisplay score={Math.round(average)} />
            <Text style={styles.totalReviews}>Based on {reviews.length} reviews</Text>
          </View>
        </View>

        {/* Review form — owns its own state */}
        <ReviewForm onSubmitted={fetchReviews} />

        <Text style={styles.historyTitle}>Recent Reviews</Text>
        {loading && <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />}

        {reviews.map((item) => (
          <View key={item._id} style={[T.card, T.cardShadow]}>
            <View style={styles.cardHeader}>
              <Text style={styles.author}>{item.student?.name || "Student"}</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                {user?.role === "warden" && (
                  <TouchableOpacity onPress={() => deleteReview(item._id)} style={{ marginLeft: 10, padding: 4 }}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <View style={styles.cardStars}>
              <StarDisplay score={item.rating} />
            </View>
            <Text style={styles.cardComment}>{item.comment}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:  { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },

  headerBlock: { marginTop: 20, marginBottom: 10 },

  avgContainer: { flexDirection: "row", alignItems: "center", marginBottom: 25 },
  avgCircle: { flexDirection: "row", alignItems: "baseline", backgroundColor: colors.warningBg, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, marginRight: 15 },
  avgNumber: { fontSize: 36, fontWeight: "bold", color: colors.warning },
  avgLabel:  { fontSize: 16, fontWeight: "bold", color: colors.warning, marginLeft: 2 },
  avgDetails: { flex: 1, justifyContent: "center" },
  totalReviews: { marginTop: 5, color: colors.textSecondary, fontSize: 13, fontWeight: "500" },

  interactiveStarBlock: { alignItems: "center", paddingVertical: 15, backgroundColor: colors.surface, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: colors.cardBorder },
  starsRow:       { flexDirection: "row", alignItems: "center" },
  starInteractive: { marginHorizontal: 6 },
  starStatic:      { marginHorizontal: 1 },

  textArea:          { height: 100, textAlignVertical: "top" },
  submitBtnDisabled: { opacity: 0.7 },

  historyTitle: { fontSize: 22, fontWeight: "bold", color: colors.textPrimary, marginBottom: 15 },

  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 },
  author:      { fontSize: 15, fontWeight: "bold", color: colors.textPrimary },
  date:        { color: colors.textMuted, fontSize: 12 },
  cardStars:   { marginBottom: 10 },
  cardComment: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
});
