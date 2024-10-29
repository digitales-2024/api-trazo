import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as cron from 'node-cron';
import { HistoryChanges } from '../intefaces/history.inteface';
import * as moment from 'moment-timezone';

@Injectable()
export class ChangeService {
  private readonly logger = new Logger(ChangeService.name);
  private readonly historyFilePath = 'history-change.json';
  private readonly changeUrl = process.env.CHANGE_SUNAT;

  constructor() {
    this.scheduleDataFetch();
  }

  async fetchData(): Promise<HistoryChanges> {
    try {
      const response = await axios.get(this.changeUrl);
      const data = response.data.trim().split('|');
      const [fecha, cambio, venta] = data;

      // Obtener la hora actual de Perú
      const hora = moment().tz('America/Lima').format('HH:mm');

      // Verificar si los datos están vacíos
      if (!fecha || !cambio || !venta) {
        this.logger.warn(
          'Datos incompletos recibidos de la URL, creando objeto vacío',
        );
        const emptyData: HistoryChanges = {
          hora: '',
          fecha: '',
          cambio: '',
          venta: '',
        };
        return emptyData;
      }

      this.logger.log(
        `Hora: ${hora}, Fecha: ${fecha}, Compra: ${cambio}, Venta: ${venta}`,
      );

      // Actualizar el historial con los nuevos datos
      await this.updateHistory({ hora, fecha, cambio, venta });
      return { hora, fecha, cambio, venta };
    } catch (error) {
      this.logger.error('Error al obtener los datos', error);
      throw error;
    }
  }

  async updateHistory(nuevaEntrada: HistoryChanges): Promise<HistoryChanges[]> {
    try {
      let history: HistoryChanges[] = [];

      // Verificar si el archivo existe
      if (!fs.existsSync(this.historyFilePath)) {
        // Si el archivo no existe, crearlo con el formato establecido
        const initialData = { historyChages: [] };
        fs.writeFileSync(
          this.historyFilePath,
          JSON.stringify(initialData, null, 2),
        );
      }

      // Leer el contenido del archivo
      const data = fs.readFileSync(this.historyFilePath, 'utf8');
      history = JSON.parse(data).historyChages || [];

      // Limitar el historial a un máximo de 2 registros
      if (history.length >= 2) {
        history.shift(); // Eliminar el primer registro
      }

      history.push(nuevaEntrada); // Agregar el nuevo dato al final

      // Guardar el historial actualizado en el archivo JSON
      const dataToSave = { historyChages: history };
      fs.writeFileSync(
        this.historyFilePath,
        JSON.stringify(dataToSave, null, 2),
      );

      // Devolver el historial actualizado
      return history;
    } catch (error) {
      this.logger.error('Error al actualizar el historial', error);
      throw error;
    }
  }

  readHistory(): HistoryChanges[] {
    try {
      if (!fs.existsSync(this.historyFilePath)) {
        throw new Error('El archivo history-change.json no existe');
      }
      const data = fs.readFileSync(this.historyFilePath, 'utf8');
      return JSON.parse(data).historyChages || [];
    } catch (error) {
      this.logger.error('Error al leer el historial', error);
      throw error;
    }
  }

  getLastValidEntry(): HistoryChanges | null {
    try {
      const history = this.readHistory();

      // Verificar si hay al menos un registro
      if (history.length === 0) {
        return null;
      }

      // Obtener el último registro
      const lastEntry = history[history.length - 1];

      // Verificar si el último registro está vacío
      if (!lastEntry.cambio || !lastEntry.venta) {
        // Si el último registro está vacío, devolver el registro anterior
        if (history.length > 1) {
          return history[history.length - 2];
        } else {
          return null; // No hay registros válidos
        }
      }

      // Devolver el último registro si no está vacío
      return lastEntry;
    } catch (error) {
      this.logger.error('Error al obtener el último registro válido', error);
      throw error;
    }
  }

  scheduleDataFetch() {
    // Programar la tarea para ejecutarse cada 12 horas a partir de las 00:00
    cron.schedule('0 0,12 * * *', () => {
      this.logger.log('Obteniendo datos de la SUNAT...');
      this.fetchData();
    });
  }

  async findAll() {
    try {
      // Obtener el dato de la última fecha registrada en el historial
      const lastEntry = this.getLastValidEntry();
      // Obtener el dato de la última fecha que devuelve la URL
      const changeData = await this.fetchData();

      // Comparar las fechas y horas de ambos datos
      if (lastEntry) {
        const lastEntryDate = new Date(`${lastEntry.fecha} ${lastEntry.hora}`);
        const changeDataDate = new Date(
          `${changeData.fecha} ${changeData.hora}`,
        );

        if (changeDataDate > lastEntryDate) {
          return changeData.venta;
        } else {
          return lastEntry.venta;
        }
      } else {
        return changeData.venta;
      }
    } catch (error) {
      this.logger.error('Error al obtener todos los registros', error);
      throw error;
    }
  }
  /*   console.log(changeData);
  console.log(lastEntry); */
}
