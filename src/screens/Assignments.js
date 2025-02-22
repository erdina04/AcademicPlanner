import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Icon, Button, LinearProgress } from '@rneui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

const priorityColors = {
  high: '#dc3545',
  medium: '#ffc107',
  low: '#28a745'
};

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState({
    id: null,
    title: '',
    course: '',
    dueDate: new Date(),
    description: '',
    priority: 'medium',
    completed: false
  });

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const saved = await AsyncStorage.getItem('@assignments');
        if (saved) setAssignments(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load assignments', e);
      }
    };
    loadAssignments();
  }, []);

  const saveAssignments = async (assignmentsToSave) => {
    try {
      await AsyncStorage.setItem('@assignments', JSON.stringify(assignmentsToSave));
    } catch (e) {
      console.error('Failed to save assignments', e);
    }
  };

  const calculateProgress = () => {
    const completed = assignments.filter(a => a.completed).length;
    return assignments.length > 0 ? completed / assignments.length : 0;
  };

  const handlePriorityChange = (level) => {
    setCurrentAssignment({...currentAssignment, priority: level});
  };

  const toggleCompletion = (id) => {
    const updated = assignments.map(a => 
      a.id === id ? {...a, completed: !a.completed} : a
    );
    setAssignments(updated);
    saveAssignments(updated);
  };

  const handleDelete = (id) => {
    const updated = assignments.filter(a => a.id !== id);
    setAssignments(updated);
    saveAssignments(updated);
  };

  const handleSave = () => {
    if (!currentAssignment.title) return;
    
    const newAssignment = {
      ...currentAssignment,
      id: currentAssignment.id || Date.now().toString(),
      dueDate: currentAssignment.dueDate.toISOString()
    };

    const updated = currentAssignment.id
      ? assignments.map(a => a.id === currentAssignment.id ? newAssignment : a)
      : [...assignments, newAssignment];

    setAssignments(updated);
    saveAssignments(updated);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Completion Progress: {Math.round(calculateProgress() * 100)}%
        </Text>
        <LinearProgress
          value={calculateProgress()}
          color="#28a745"
          style={styles.progressBar}
          variant="determinate"
        />
      </View>

      <FlatList
        data={assignments.sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate))}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[
            styles.assignmentCard,
            { borderLeftColor: priorityColors[item.priority], opacity: item.completed ? 0.6 : 1 }
          ]}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>{item.title}</Text>
              <View style={styles.courseChip}>
                <Text style={styles.chipText}>{item.course}</Text>
              </View>
            </View>
            
            <View style={styles.cardBody}>
              <Text style={styles.dueDate}>
                Due: {new Date(item.dueDate).toLocaleDateString()} • 
                {new Date(item.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {item.description && <Text style={styles.description}>{item.description}</Text>}
            </View>

            <View style={styles.cardFooter}>
              <Button
                icon={<Icon name={item.completed ? 'check-circle' : 'radio-button-unchecked'} 
                       color={item.completed ? '#28a745' : '#666'} />}
                type="clear"
                onPress={() => toggleCompletion(item.id)}
              />
              <View style={styles.footerActions}>
                <Button
                  icon={<Icon name="edit" color="#666" />}
                  type="clear"
                  onPress={() => {
                    setCurrentAssignment({...item, dueDate: new Date(item.dueDate)});
                    setModalVisible(true);
                  }}
                />
                <Button
                  icon={<Icon name="delete" color="#dc3545" />}
                  type="clear"
                  onPress={() => handleDelete(item.id)}
                />
              </View>
            </View>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setCurrentAssignment({
            id: null,
            title: '',
            course: '',
            dueDate: new Date(),
            description: '',
            priority: 'medium',
            completed: false
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
              {currentAssignment.id ? 'Edit Assignment' : 'New Assignment'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Assignment Title"
              placeholderTextColor="#888"
              value={currentAssignment.title}
              onChangeText={text => setCurrentAssignment({...currentAssignment, title: text})}
            />

            <TextInput
              style={styles.input}
              placeholder="Course Name"
              placeholderTextColor="#888"
              value={currentAssignment.course}
              onChangeText={text => setCurrentAssignment({...currentAssignment, course: text})}
            />

            <View style={styles.priorityContainer}>
              {Object.keys(priorityColors).map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.priorityButton,
                    currentAssignment.priority === level && 
                      { backgroundColor: priorityColors[level] }
                  ]}
                  onPress={() => handlePriorityChange(level)}
                >
                  <Text 
                    style={[
                      styles.priorityText,
                      currentAssignment.priority === level && { color: 'white' }
                    ]}
                  >
                    {level.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.dateInput} 
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>
                {currentAssignment.dueDate.toLocaleDateString()} • 
                {currentAssignment.dueDate.toLocaleTimeString()}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={currentAssignment.dueDate}
                mode="datetime"
                display="default"
                onChange={(e, date) => {
                  setShowDatePicker(false);
                  if (date) setCurrentAssignment({...currentAssignment, dueDate: date});
                }}
              />
            )}

            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Description"
              placeholderTextColor="#888"
              multiline
              value={currentAssignment.description}
              onChangeText={text => setCurrentAssignment({...currentAssignment, description: text})}
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
                title="Save Assignment"
                buttonStyle={styles.saveButton}
                onPress={handleSave}
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
  progressContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    margin: 10,
  },
  progressText: {
    color: '#888',
    fontSize: 14,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
  },
  assignmentCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    margin: 10,
    padding: 15,
    borderLeftWidth: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  courseChip: {
    backgroundColor: '#333333',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    color: '#fff',
    fontSize: 12,
  },
  dueDate: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  description: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },
  footerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 12,
  },
  priorityButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  dateInput: {
    backgroundColor: '#333333',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  dateText: {
    color: '#fff',
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

export default Assignments;