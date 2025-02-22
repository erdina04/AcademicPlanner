import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Icon, Button } from '@rneui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CourseSchedule = () => {
  const [courses, setCourses] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentCourse, setCurrentCourse] = useState({
    id: null,
    name: '',
    time: new Date(),
    days: [],
    location: '',
    credits: ''
  });
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const savedCourses = await AsyncStorage.getItem('@courses');
        if (savedCourses) setCourses(JSON.parse(savedCourses));
      } catch (e) {
        console.error('Failed to load courses', e);
      }
    };
    loadCourses();
  }, []);

  const saveCourses = async (coursesToSave) => {
    try {
      await AsyncStorage.setItem('@courses', JSON.stringify(coursesToSave));
    } catch (e) {
      console.error('Failed to save courses', e);
    }
  };

  const handleDayPress = (day) => {
    const updatedDays = currentCourse.days.includes(day)
      ? currentCourse.days.filter(d => d !== day)
      : [...currentCourse.days, day];
    setCurrentCourse({...currentCourse, days: updatedDays});
  };

  const handleSaveCourse = () => {
    const courseData = {
      ...currentCourse,
      id: currentCourse.id || Date.now().toString(),
      time: currentCourse.time.toISOString()
    };

    const updatedCourses = currentCourse.id 
      ? courses.map(c => c.id === currentCourse.id ? courseData : c)
      : [...courses, courseData];

    setCourses(updatedCourses);
    saveCourses(updatedCourses);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.courseCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.courseTitle}>{item.name}</Text>
              <Text style={styles.credits}>{item.credits} Credits</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.daysContainer}>
                {daysOfWeek.map(day => (
                  <Text 
                    key={day}
                    style={[
                      styles.dayPill,
                      item.days.includes(day) && styles.selectedDay
                    ]}
                  >
                    {day}
                  </Text>
                ))}
              </View>
              <Text style={styles.timeText}>
                {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text style={styles.locationText}>{item.location}</Text>
            </View>
            <View style={styles.cardFooter}>
              <Button
                icon={<Icon name="edit" size={20} color="#fff" />}
                buttonStyle={styles.footerButton}
                onPress={() => {
                  setCurrentCourse({...item, time: new Date(item.time)});
                  setModalVisible(true);
                }}
              />
              <Button
                icon={<Icon name="delete" size={20} color="#fff" />}
                buttonStyle={[styles.footerButton, { backgroundColor: '#dc3545' }]}
                onPress={() => {
                  const updated = courses.filter(c => c.id !== item.id);
                  setCourses(updated);
                  saveCourses(updated);
                }}
              />
            </View>
          </View>
        )}
      />

      <TouchableOpacity 
        style={styles.addButton} 
        onPress={() => {
          setCurrentCourse({
            id: null,
            name: '',
            time: new Date(),
            days: [],
            location: '',
            credits: ''
          });
          setModalVisible(true);
        }}
      >
        <Icon name="add" size={30} color="white" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {currentCourse.id ? 'Edit Course' : 'Add Course'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Course Name"
              placeholderTextColor="#888"
              value={currentCourse.name}
              onChangeText={text => setCurrentCourse({...currentCourse, name: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Credits"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={currentCourse.credits}
              onChangeText={text => setCurrentCourse({...currentCourse, credits: text})}
            />

            <TouchableOpacity 
              style={styles.timeInput}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.timeText}>
                {currentCourse.time.toLocaleTimeString()}
              </Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={currentCourse.time}
                mode="time"
                display="default"
                onChange={(e, date) => {
                  setShowTimePicker(false);
                  if (date) setCurrentCourse({...currentCourse, time: date});
                }}
              />
            )}

            <View style={styles.daysContainer}>
              {daysOfWeek.map(day => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    currentCourse.days.includes(day) && styles.selectedDay
                  ]}
                  onPress={() => handleDayPress(day)}
                >
                  <Text style={styles.dayText}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Location"
              placeholderTextColor="#888"
              value={currentCourse.location}
              onChangeText={text => setCurrentCourse({...currentCourse, location: text})}
            />

            <View style={styles.buttonRow}>
              <Button
                title="Cancel"
                type="outline"
                buttonStyle={styles.cancelButton}
                titleStyle={styles.cancelText}
                onPress={() => setModalVisible(false)}
              />
              <Button
                title="Save Course"
                buttonStyle={styles.saveButton}
                onPress={handleSaveCourse}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: 20,
  },
  courseCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    margin: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  credits: {
    color: '#888',
    fontSize: 14,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginVertical: 8,
  },
  dayPill: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#3a3a3a',
    color: '#fff',
    fontSize: 12,
    margin: 2,
  },
  selectedDay: {
    backgroundColor: '#28a745',
    color: 'white',
  },
  timeText: {
    color: '#28a745',
    fontSize: 16,
    marginVertical: 4,
  },
  locationText: {
    color: '#888',
    fontSize: 14,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#28a745',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalContent: {
    backgroundColor: '#2d2d2d',
    margin: 20,
    borderRadius: 12,
    padding: 20,
  },
  input: {
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    fontSize: 16,
    color: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    paddingVertical: 10,
    flex: 1,
    marginLeft: 10,
  },
  cancelButton: {
    borderColor: '#28a745',
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  cancelText: {
    color: '#888',
  },
  dayButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#3a3a3a',
  },
  dayText: {
    color: '#fff',
    fontSize: 14,
  },
  footerButton: {
    backgroundColor: '#333333',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
  },
});

export default CourseSchedule;