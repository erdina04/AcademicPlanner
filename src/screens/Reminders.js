import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Icon, Button, Avatar } from '@rneui/themed';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const repeatOptions = [
  { label: 'None', value: 'none' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' }
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentReminder, setCurrentReminder] = useState({
    id: null,
    title: '',
    date: new Date(),
    repeat: 'none',
    notificationId: null
  });

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please enable notifications for reminders');
      }
    };
    requestPermissions();
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const saved = await AsyncStorage.getItem('@reminders');
      if (saved) {
        const parsed = JSON.parse(saved);
        setReminders(parsed);
        parsed.forEach(scheduleExistingNotification);
      }
    } catch (e) {
      console.error('Failed to load reminders', e);
    }
  };

  const saveReminders = async (remindersToSave) => {
    try {
      await AsyncStorage.setItem('@reminders', JSON.stringify(remindersToSave));
    } catch (e) {
      console.error('Failed to save reminders', e);
    }
  };

  const scheduleExistingNotification = async (reminder) => {
    if (new Date(reminder.date) > new Date()) {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: 'Reminder triggered',
        },
        trigger: reminder.date,
      });
      return notificationId;
    }
    return null;
  };

  const handleSave = async () => {
    if (!currentReminder.title) return;
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: currentReminder.title,
        body: 'Reminder triggered',
      },
      trigger: currentReminder.date,
    });

    const newReminder = {
      ...currentReminder,
      id: currentReminder.id || Date.now().toString(),
      notificationId,
    };

    const updated = currentReminder.id
      ? reminders.map(r => r.id === currentReminder.id ? newReminder : r)
      : [...reminders, newReminder];

    setReminders(updated);
    saveReminders(updated);
    setModalVisible(false);
  };

  const handleDelete = async (id) => {
    const reminderToDelete = reminders.find(r => r.id === id);
    if (reminderToDelete?.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(reminderToDelete.notificationId);
    }
    
    const updated = reminders.filter(r => r.id !== id);
    setReminders(updated);
    saveReminders(updated);
  };

  const getNextOccurrence = (date, repeat) => {
    const now = new Date();
    let nextDate = new Date(date);
    
    while (nextDate < now) {
      switch (repeat) {
        case 'daily': nextDate.setDate(nextDate.getDate() + 1); break;
        case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
        case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
        default: return null;
      }
    }
    return nextDate;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={reminders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const nextDate = getNextOccurrence(new Date(item.date), item.repeat);
          
          return (
            <View style={styles.reminderCard}>
              <Avatar
                size={40}
                rounded
                icon={{ name: 'notifications', color: 'white' }}
                containerStyle={styles.avatar}
              />
              <View style={styles.cardContent}>
                <Text style={styles.title}>{item.title}</Text>
                <View style={styles.dateRow}>
                  <Icon name="calendar-today" size={16} color="#666" />
                  <Text style={styles.dateText}>
                    {nextDate?.toLocaleString() || 'Completed'}
                  </Text>
                </View>
                {item.repeat !== 'none' && (
                  <View style={styles.repeatBadge}>
                    <Text style={styles.repeatText}>
                      {item.repeat.charAt(0).toUpperCase() + item.repeat.slice(1)}
                    </Text>
                  </View>
                )}
              </View>
              <Button
                icon={<Icon name="delete" color="#dc3545" />}
                type="clear"
                onPress={() => handleDelete(item.id)}
              />
            </View>
          );
        }}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setCurrentReminder({
            id: null,
            title: '',
            date: new Date(),
            repeat: 'none',
            notificationId: null
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
              {currentReminder.id ? 'Edit Reminder' : 'New Reminder'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Reminder Title"
              placeholderTextColor="#888"
              value={currentReminder.title}
              onChangeText={text => setCurrentReminder({...currentReminder, title: text})}
            />

            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Icon name="calendar" size={20} color="#666" />
              <Text style={styles.dateText}>
                {currentReminder.date.toLocaleString()}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={currentReminder.date}
                mode="datetime"
                display="default"
                onChange={(e, date) => {
                  setShowDatePicker(false);
                  if (date) setCurrentReminder({...currentReminder, date});
                }}
              />
            )}

            <View style={styles.repeatContainer}>
              {repeatOptions.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.repeatOption,
                    currentReminder.repeat === option.value && 
                      { backgroundColor: '#28a745' }
                  ]}
                  onPress={() => setCurrentReminder({...currentReminder, repeat: option.value})}
                >
                  <Text style={[
                    styles.repeatOptionText,
                    currentReminder.repeat === option.value && { color: 'white' }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.buttonRow}>
              <Button
                title="Cancel"
                type="outline"
                buttonStyle={styles.cancelButton}
                titleStyle={styles.cancelText}
                onPress={() => setModalVisible(false)}
              />
              <Button
                title="Save Reminder"
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
  reminderCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    margin: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#28a745',
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 5,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    color: '#888',
    fontSize: 14,
  },
  repeatBadge: {
    backgroundColor: '#333333',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  repeatText: {
    color: '#ccc',
    fontSize: 12,
  },
  repeatContainer: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 15,
  },
  repeatOption: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
  repeatOptionText: {
    fontSize: 14,
    color: '#fff',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#333333',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
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

export default Reminders;