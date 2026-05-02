import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator } from "react-native";
import API from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { colors, T } from "../theme";

export default function ReviewScreen() {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

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

  const submitReview = async () => {
    if (rating < 1 || rating > 5) return Alert.alert("Hold on!", "Please select a star rating first.");
    if (!comment.trim()) return Alert.alert("Hold on!", "Please share a few words about your experience.");
    
    setIsSubmitting(true);
    try {
      await API.post("/reviews", { rating, comment });
      Alert.alert("Thank You!", "Your review has been successfully posted.");
      setRating(0); 
      setComment("");
      fetchReviews();
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateAverage = () => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  // Dedicated component for rendering interactive or static stars
  const StarDisplay = ({ score, interactive = false }) => {
    const stars = [1, 2, 3, 4, 5];
    return (
      <View style={styles.starsRow}>
        {stars.map((star) => (
          <TouchableOpacity 
            key={star} 
            disabled={!interactive}
            onPress={() => interactive && setRating(star)}
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
  };

  return (
    <SafeAreaView style={[T.screen, styles.safeArea]}>
      <FlatList
        style={styles.container}
        data={reviews}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <>
            <View style={styles.headerBlock}>
              <Text style={T.title}>Rate Our Hostel</Text>
              <Text style={T.subtitle}>Share your experience to help us improve.</Text>
            </View>

            <View style={[T.card, T.cardShadow, styles.avgContainer]}>
              <View style={styles.avgCircle}>
                <Text style={styles.avgNumber}>{calculateAverage()}</Text>
                <Text style={styles.avgLabel}>/ 5</Text>
              </View>
              <View style={styles.avgDetails}>
                <StarDisplay score={Math.round(calculateAverage())} />
                <Text style={styles.totalReviews}>Based on {reviews.length} reviews</Text>
              </View>
            </View>

            <View style={[T.card, T.cardShadow]}>
              <Text style={[T.title, {fontSize: 20, marginTop: 0}]}>Write a Review</Text>
              
              <Text style={T.label}>TAP TO RATE</Text>
              <View style={styles.interactiveStarBlock}>
                <StarDisplay score={rating} interactive={true} />
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
                onPress={submitReview}
                disabled={isSubmitting}
              >
                <Ionicons name="chatbox-ellipses" size={18} color="#fff" style={{marginRight: 8}} />
                <Text style={T.primaryBtnText}>{isSubmitting ? "Submitting..." : "Submit Review"}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.historyTitle}>Recent Reviews</Text>
            {loading && <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />}
          </>
        }
        renderItem={({ item }) => (
          <View style={[T.card, T.cardShadow]}>
            <View style={styles.cardHeader}>
              <Text style={styles.author}>{item.student?.name || "Student"}</Text>
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={styles.cardStars}>
              <StarDisplay score={item.rating} />
            </View>
            <Text style={styles.cardComment}>{item.comment}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  
  headerBlock: { marginTop: 20, marginBottom: 10 },
  
  avgContainer: { flexDirection: "row", alignItems: "center", marginBottom: 25 },
  avgCircle: { flexDirection: "row", alignItems: "baseline", backgroundColor: colors.warningBg, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, marginRight: 15 },
  avgNumber: { fontSize: 36, fontWeight: "bold", color: colors.warning },
  avgLabel: { fontSize: 16, fontWeight: "bold", color: colors.warning, marginLeft: 2 },
  avgDetails: { flex: 1, justifyContent: "center" },
  totalReviews: { marginTop: 5, color: colors.textSecondary, fontSize: 13, fontWeight: "500" },
  
  interactiveStarBlock: { alignItems: "center", paddingVertical: 15, backgroundColor: colors.surface, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: colors.cardBorder },
  starsRow: { flexDirection: "row", alignItems: "center" },
  starInteractive: { marginHorizontal: 6 },
  starStatic: { marginHorizontal: 1 },
  
  textArea: { height: 100, textAlignVertical: "top" },
  submitBtnDisabled: { opacity: 0.7 },
  
  historyTitle: { fontSize: 22, fontWeight: "bold", color: colors.textPrimary, marginBottom: 15 },
  
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 5 },
  author: { fontSize: 15, fontWeight: "bold", color: colors.textPrimary },
  date: { color: colors.textMuted, fontSize: 12 },
  cardStars: { marginBottom: 10 },
  cardComment: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 }
});
