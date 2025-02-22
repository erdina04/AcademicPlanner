import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Icon, Button, LinearProgress } from '@rneui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GradeCalculator = () => {
  const [courses, setCourses] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [componentModalVisible, setComponentModalVisible] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [currentComponent, setCurrentComponent] = useState({
    name: '',
    weight: '',
    score: ''
  });

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const saved = await AsyncStorage.getItem('@gradeCourses');
        if (saved) setCourses(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load courses', e);
      }
    };
    loadCourses();
  }, []);

  const saveCourses = async (coursesToSave) => {
    try {
      await AsyncStorage.setItem('@gradeCourses', JSON.stringify(coursesToSave));
    } catch (e) {
      console.error('Failed to save courses', e);
    }
  };

  const calculateGrade = (components) => {
    let totalWeight = 0;
    let earned = 0;
    
    components.forEach(comp => {
      const weight = parseFloat(comp.weight) || 0;
      const score = parseFloat(comp.score) || 0;
      totalWeight += weight;
      earned += (weight * score) / 100;
    });

    return totalWeight > 0 ? (earned / totalWeight) * 100 : 0;
  };

  const handleAddCourse = () => {
    setCurrentCourse({
      id: null,
      name: '',
      components: []
    });
    setModalVisible(true);
  };

  const handleSaveCourse = () => {
    if (!currentCourse.name) return;
    
    const newCourse = {
      ...currentCourse,
      id: currentCourse.id || Date.now().toString()
    };

    const updated = currentCourse.id
      ? courses.map(c => c.id === currentCourse.id ? newCourse : c)
      : [...courses, newCourse];

    setCourses(updated);
    saveCourses(updated);
    setModalVisible(false);
  };

  const handleAddComponent = () => {
    if (!currentComponent.name || !currentComponent.weight) return;
    
    const newComponent = {
      ...currentComponent,
      id: Date.now().toString()
    };

    const updatedCourse = {
      ...currentCourse,
      components: [...currentCourse.components, newComponent]
    };

    const updatedCourses = courses.map(c => 
      c.id === currentCourse.id ? updatedCourse : c
    );

    setCourses(updatedCourses);
    saveCourses(updatedCourses);
    setComponentModalVisible(false);
  };

  const handleDeleteCourse = (id) => {
    const updated = courses.filter(c => c.id !== id);
    setCourses(updated);
    saveCourses(updated);
  };

  const handleScoreChange = (courseId, componentId, score) => {
    const updated = courses.map(course => {
      if (course.id === courseId) {
        return {
          ...course,
          components: course.components.map(comp => 
            comp.id === componentId ? {...comp, score} : comp
          )
        };
      }
      return course;
    });
    setCourses(updated);
    saveCourses(updated);
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
              <LinearProgress
                value={calculateGrade(item.components)/100}
                color="#28a745"
                variant="determinate"
                style={{ width: 80, height: 80, borderRadius: 40 }}
              />
            </View>

            <View style={styles.componentsContainer}>
              {item.components.map(comp => (
                <View key={comp.id} style={styles.componentRow}>
                  <Text style={styles.componentName}>{comp.name}</Text>
                  <Text style={styles.componentWeight}>{comp.weight}%</Text>
                  <TextInput
                    style={styles.scoreInput}
                    value={comp.score}
                    keyboardType="numeric"
                    placeholder="Score"
                    placeholderTextColor="#666"
                    onChangeText={text => handleScoreChange(item.id, comp.id, text)}
                  />
                </View>
              ))}
            </View>

            <View style={styles.cardFooter}>
              <Button
                title="Add Component"
                type="outline"
                buttonStyle={styles.addComponentButton}
                titleStyle={styles.addComponentText}
                onPress={() => {
                  setCurrentCourse(item);
                  setCurrentComponent({ name: '', weight: '', score: '' });
                  setComponentModalVisible(true);
                }}
              />
              <Button
                icon={<Icon name="delete" color="#dc3545" />}
                type="clear"
                onPress={() => handleDeleteCourse(item.id)}
              />
            </View>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddCourse}
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
              {currentCourse?.id ? 'Edit Course' : 'New Course'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Course Name"
              placeholderTextColor="#888"
              value={currentCourse?.name || ''}
              onChangeText={text => setCurrentCourse({...currentCourse, name: text})}
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

      <Modal visible={componentModalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Grade Component</Text>

            <TextInput
              style={styles.input}
              placeholder="Component Name"
              placeholderTextColor="#888"
              value={currentComponent.name}
              onChangeText={text => setCurrentComponent({...currentComponent, name: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Weight (%)"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={currentComponent.weight}
              onChangeText={text => setCurrentComponent({...currentComponent, weight: text})}
            />

            <View style={styles.buttonRow}>
              <Button
                title="Cancel"
                type="outline"
                buttonStyle={styles.cancelButton}
                titleStyle={styles.cancelText}
                onPress={() => setComponentModalVisible(false)}
              />
              <Button
                title="Add Component"
                buttonStyle={styles.saveButton}
                onPress={handleAddComponent}
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
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  componentsContainer: {
    marginVertical: 10,
  },
  componentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  componentName: {
    flex: 2,
    color: '#ccc',
    fontSize: 14,
  },
  componentWeight: {
    flex: 1,
    textAlign: 'right',
    color: '#888',
    fontSize: 14,
  },
  scoreInput: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#28a745',
    padding: 5,
    textAlign: 'center',
    color: '#fff',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },
  addComponentButton: {
    borderColor: '#28a745',
    borderRadius: 8,
  },
  addComponentText: {
    color: '#28a745',
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
    backgroundColor: '#1a1a1a',
    margin: 20,
    borderRadius: 12,
    padding: 20,
  },
  input: {
    backgroundColor: '#333333',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    fontSize: 16,
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
});

export default GradeCalculator;