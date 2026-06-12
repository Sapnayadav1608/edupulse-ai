import api from './api';

export const aiService = {
  // Full prediction (all 3 models in one call)
  predictFull: (data: PredictionInput) =>
    api.post('/ai/predict/full', data),

  predictPerformance: (data: PredictionInput) =>
    api.post('/ai/predict/performance', data),

  predictAttendance: (data: PredictionInput) =>
    api.post('/ai/predict/attendance', data),

  predictPlacement: (data: PredictionInput) =>
    api.post('/ai/predict/placement', data),

  checkHealth: () =>
    api.get('/ai/health'),
};

export interface PredictionInput {
  attendance_pct:  number;
  internal1_marks: number;
  internal2_marks: number;
  assignment_avg:  number;
  cgpa:            number;
  study_hours:     number;
  backlogs:        number;
}
