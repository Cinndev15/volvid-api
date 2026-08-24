import {
  createAppointment,
  getClinicAppointments,
  updateAppointmentStatus,
  deleteAppointment
} from '../services/appointment.service.js';

export const scheduleAppointment = async (req, res, next) => {
  try {
    const { clinic_id, pet_id, appointment_date, appointment_time, motive } = req.body;
    if (!clinic_id || !pet_id || !appointment_date || !appointment_time || !motive) {
      return res.status(400).json({
        success: false,
        message: 'clinic_id, pet_id, appointment_date, appointment_time y motive son campos requeridos.'
      });
    }

    const appointment = await createAppointment(req.body);
    res.status(201).json({
      success: true,
      message: 'Cita programada exitosamente en la veterinaria.',
      data: appointment
    });
  } catch (error) {
    if (error.message === 'PET_NOT_FOUND') {
      return res.status(404).json({ success: false, message: 'La mascota indicada no existe.' });
    }
    next(error);
  }
};

export const getAppointments = async (req, res, next) => {
  try {
    const { clinicId } = req.params;
    const { date, month, year, status, search } = req.query;

    if (!clinicId) {
      return res.status(400).json({ success: false, message: 'ID de clínica requerido.' });
    }

    const appointments = await getClinicAppointments(parseInt(clinicId, 10), {
      date,
      month,
      year,
      status,
      search
    });

    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    next(error);
  }
};

export const changeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { clinic_id, status } = req.body;

    if (!id || !clinic_id || !status) {
      return res.status(400).json({
        success: false,
        message: 'ID de cita, clinic_id y status son requeridos.'
      });
    }

    const result = await updateAppointmentStatus(parseInt(id, 10), parseInt(clinic_id, 10), status);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const removeAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { clinic_id } = req.query;

    if (!id || !clinic_id) {
      return res.status(400).json({ success: false, message: 'ID de cita y clinic_id requeridos.' });
    }

    const result = await deleteAppointment(parseInt(id, 10), parseInt(clinic_id, 10));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
