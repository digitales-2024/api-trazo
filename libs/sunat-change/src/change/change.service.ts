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

  /**
   *  funcuion para obtener el tipo de cambio cada 12 horas
   * Constructor de la clase
   */
  constructor() {
    this.scheduleDataFetch();
  }

  /**
   * Obtiene los datos de la URL y los registra en el historial
   * @returns Datos obtenidos de la URL
   */
  async fetchData(): Promise<HistoryChanges> {
    try {
      const response = await axios.get(this.changeUrl);
      const data = response.data.trim().split('|');
      const [fecha, cambio, venta] = data;

      // Obtener la hora actual de Perú
      const hora = moment().tz('America/Lima').format('HH:mm');

      // Actualizar el historial con los nuevos datos
      await this.updateHistory({ hora, fecha, cambio, venta });
      return { hora, fecha, cambio, venta };
    } catch (error) {
      this.logger.error('Error al obtener los datos', error);
      throw error;
    }
  }

  /**
   * Obtiene los datos de la URL sin actualizar el historial
   * @returns Datos obtenidos de la URL
   */
  async dataUrl(): Promise<HistoryChanges> {
    try {
      const response = await axios.get(this.changeUrl);
      const data = response.data.trim().split('|');
      const [fecha, cambio, venta] = data;

      // Obtener la hora actual de Perú
      const hora = moment().tz('America/Lima').format('HH:mm');

      return { hora, fecha, cambio, venta };
    } catch (error) {
      this.logger.error('Error al obtener los datos', error);
      throw error;
    }
  }

  /**
   * Actualiza el historial con el nuevo dato
   * @param nuevaEntrada Datos a registrar en el historial
   * @returns Historial actualizado
   */
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

      // Validar que el nuevo dato no sea vacío o nulo
      if (
        !nuevaEntrada.hora ||
        !nuevaEntrada.fecha ||
        !nuevaEntrada.cambio ||
        !nuevaEntrada.venta
      ) {
        return history;
      }

      // Validar la actualización del historial
      if (history.length > 0) {
        // Si hay registros y la hora es la misma que la del nuevo dato, no registrar nada
        if (history[history.length - 1].hora === nuevaEntrada.hora) {
          return history;
        }
      }

      // Limitar el historial a un máximo de 2 registros
      history = [nuevaEntrada, nuevaEntrada];

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

  /**
   * Lee el historial de cambios
   * @returns Historial de cambios
   */
  readHistory(): HistoryChanges[] {
    try {
      if (!fs.existsSync(this.historyFilePath)) {
        throw new Error('El history-change no existe');
      }
      const data = fs.readFileSync(this.historyFilePath, 'utf8');
      return JSON.parse(data).historyChages || [];
    } catch (error) {
      this.logger.error('Error al leer el historial', error);
      throw error;
    }
  }
  /**
   * funcion para validar si existe el archivo JSON
   * @returns true si existe, false si no existe
   */
  readArchJson(): boolean {
    try {
      if (fs.existsSync(this.historyFilePath)) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      this.logger.error('Error al verificar el archivo JSON', error);
      return false;
    }
  }

  /**
   * Obtiene el último registro válido del historial
   * @returns Último registro válido
   */
  getLastValidEntry(): HistoryChanges | null {
    try {
      const history = this.readHistory();

      // Obtener el registro backap
      const lastEntry = history[history.length - 0];

      // Devolver el registro backap
      return lastEntry;
    } catch (error) {
      this.logger.error('Error al obtener el backap ', error);
      throw error;
    }
  }

  /**
   * Programa la tarea de obtención de datos
   */
  scheduleDataFetch() {
    // Programar la tarea para ejecutarse cada 30 segundos
    cron.schedule('0 0,12 * * *', () => {
      this.logger.log('Obteniendo datos de la SUNAT...');
      this.fetchData();
    });
  }

  /**
   * Obtiene todos los registros
   * @returns venta, tipo de cambio actual
   */
  async findAll() {
    try {
      // Verificar si el archivo existe
      const fileExists = this.readArchJson();
      if (!fileExists) {
        // Si el archivo no existe, obtener y registrar los datos inmediatamente
        await this.fetchData();
      }

      // Obtener el dato de la última fecha registrada en el historial
      const lastEntry = this.getLastValidEntry();
      // Obtener el dato de la última fecha que devuelve la URL sin actualizar el historial
      const changeData = await this.dataUrl();

      // Validar el dato 'venta' de ambos datos
      if (lastEntry) {
        const lastEntryVenta = lastEntry.venta;
        const changeDataVenta = changeData.venta;

        // Comparar los datos 'venta'
        if (!changeDataVenta || changeDataVenta === '') {
          // Si el dato 'venta' de la URL es nulo o vacío, devolver el del historial
          return lastEntryVenta;
        } else if (changeDataVenta !== lastEntryVenta) {
          // Si los datos 'venta' son distintos, devolver el de la URL
          return changeDataVenta;
        } else {
          // Si los datos 'venta' son iguales, devolver el del historial
          return lastEntryVenta;
        }
      } else {
        // Si no hay datos en el historial, devolver el dato de la URL
        return changeData.venta;
      }
    } catch (error) {
      this.logger.error('Error al obtener todos los registros', error);
      throw error;
    }
  }
}
