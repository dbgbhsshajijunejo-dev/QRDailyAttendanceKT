
import { localDb } from './db';
import { STORE_STUDENTS, STORE_ATTENDANCE } from '../constants';

export const syncWithCloud = async () => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 2000));

  const students = await localDb.getAllStudents();
  const attendance = await localDb.getAllAttendance();

  const pendingStudents = students.filter(s => s.sync_status !== 'synced');
  const pendingAttendance = attendance.filter(a => a.sync_status !== 'synced');

  // In a real app, this would use the Supabase client:
  // const { data, error } = await supabase.from('students').upsert(pendingStudents);

  for (const s of pendingStudents) {
    await localDb.updateSyncStatus(STORE_STUDENTS, s.id, 'synced');
  }

  for (const a of pendingAttendance) {
    await localDb.updateSyncStatus(STORE_ATTENDANCE, a.id, 'synced');
  }

  return {
    syncedStudents: pendingStudents.length,
    syncedAttendance: pendingAttendance.length
  };
};
