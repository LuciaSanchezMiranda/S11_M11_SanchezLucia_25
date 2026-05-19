import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl
} from '@angular/forms';

export interface Estudiante {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  edad: number | null;
  carrera: string;
  codigo: string;
  fechaNacimiento: string;
  genero: string;
  direccion: string;
  eliminado?: boolean;
}

@Component({
  selector: 'app-estudiantes',
  standalone: false,
  templateUrl: './estudiantes.component.html',
  styleUrls: ['./estudiantes.component.css']
})
export class EstudiantesComponent {

  /* ─── PASOS DEL FORMULARIO ─── */
  paso = 1;

  /* ─── FORMULARIO ─── */
  estudianteForm: FormGroup;

  /* ─── LISTAS ─── */
  estudiantes: Estudiante[] = [];          // activos
  papelera: Estudiante[]    = [];          // eliminados (soft delete)

  /* ─── VISTA ─── */
  vistaActual: 'activos' | 'papelera' = 'activos';

  /* ─── MODAL DETALLES ─── */
  estudianteSeleccionado: Estudiante | null = null;

  /* ─── MODAL CONFIRMACIÓN ELIMINAR ─── */
  mostrarConfirmacion = false;
  indiceAEliminar: number | null = null;

  /* ─── EDITAR ─── */
  editando = false;
  indiceEditando: number | null = null;

  /* ─── CONTADOR ID ─── */
  private nextId = 1;

  /* ─── NOTIFICACIÓN TOAST ─── */
  toast: { mensaje: string; tipo: 'exito' | 'info' | 'error' } | null = null;
  private toastTimer: any;

  constructor(private fb: FormBuilder) {

    this.estudianteForm = this.fb.group({

      nombre: [
        '',
        [Validators.required, Validators.minLength(2)]
      ],

      apellido: [
        '',
        [Validators.required]
      ],

      correo: [
        '',
        [Validators.required, Validators.email]
      ],

      telefono: [
        '',
        [Validators.required, Validators.pattern(/^\+?[0-9]{7,15}$/)]
      ],

      edad: [
        '',
        [Validators.required, Validators.min(16), Validators.max(100)]
      ],

      carrera: [
        '',
        [Validators.required]
      ],

      codigo: [
        '',
        [Validators.required, Validators.minLength(4)]
      ],

      fechaNacimiento: [''],

      genero: [''],

      direccion: [
        '',
        [Validators.required, Validators.minLength(10)]
      ]

    });

  }

  /* ══════════════════════════════
     ACCESO A CONTROLES
  ══════════════════════════════ */

  get f(): { [key: string]: AbstractControl } {
    return this.estudianteForm.controls;
  }

  campoInvalido(campo: string): boolean {
    const c = this.f[campo];
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  campoValido(campo: string): boolean {
    const c = this.f[campo];
    return !!(c && c.valid && (c.dirty || c.touched));
  }

  /* ══════════════════════════════
     PASOS
  ══════════════════════════════ */

  private camposPaso1 = ['nombre', 'apellido', 'correo', 'telefono', 'edad', 'codigo'];

  paso1Valido(): boolean {
    return this.camposPaso1.every(campo => this.f[campo].valid);
  }

  avanzarPaso2(): void {
    this.camposPaso1.forEach(campo => this.f[campo].markAsTouched());
    if (this.paso1Valido()) {
      this.paso = 2;
    }
  }

  /* ══════════════════════════════
     CREATE — Guardar / Actualizar
  ══════════════════════════════ */

  guardarEstudiante(): void {

    this.estudianteForm.markAllAsTouched();

    if (this.estudianteForm.invalid) {
      return;
    }

    if (this.editando && this.indiceEditando !== null) {

      /* UPDATE */
      const id = this.estudiantes[this.indiceEditando].id;
      this.estudiantes[this.indiceEditando] = {
        ...this.estudianteForm.value,
        id,
        eliminado: false
      };

      this.editando        = false;
      this.indiceEditando  = null;
      this.mostrarToast('Estudiante actualizado correctamente.', 'exito');

    } else {

      /* CREATE */
      const nuevo: Estudiante = {
        ...this.estudianteForm.value,
        id: this.nextId++,
        eliminado: false
      };
      this.estudiantes.push(nuevo);
      this.mostrarToast('Estudiante registrado correctamente.', 'exito');

    }

    this.estudianteForm.reset();
    this.paso = 1;
  }

  /* ══════════════════════════════
     READ — Ver detalles
  ══════════════════════════════ */

  verDetalles(estudiante: Estudiante): void {
    this.estudianteSeleccionado = estudiante;
  }

  cerrarModal(): void {
    this.estudianteSeleccionado = null;
  }

  /* ══════════════════════════════
     UPDATE — Editar
  ══════════════════════════════ */

  editarEstudiante(estudiante: Estudiante, index: number): void {
    this.estudianteForm.patchValue(estudiante);
    this.editando       = true;
    this.indiceEditando = index;
    this.paso           = 1;
    this.vistaActual    = 'activos';
  }

  cancelarEdicion(): void {
    this.estudianteForm.reset();
    this.editando       = false;
    this.indiceEditando = null;
    this.paso           = 1;
  }

  /* ══════════════════════════════
     DELETE — Soft delete (papelera)
  ══════════════════════════════ */

  confirmarEliminar(index: number): void {
    this.indiceAEliminar    = index;
    this.mostrarConfirmacion = true;
  }

  cancelarEliminar(): void {
    this.indiceAEliminar    = null;
    this.mostrarConfirmacion = false;
  }

  eliminarEstudiante(): void {

    if (this.indiceAEliminar === null) return;

    const [eliminado] = this.estudiantes.splice(this.indiceAEliminar, 1);
    eliminado.eliminado = true;
    this.papelera.push(eliminado);

    this.mostrarConfirmacion = false;
    this.indiceAEliminar     = null;
    this.mostrarToast('Estudiante movido a la papelera.', 'info');
  }

  /* ══════════════════════════════
     RESTORE — Restaurar desde papelera
  ══════════════════════════════ */

  restaurarEstudiante(index: number): void {
    const [restaurado] = this.papelera.splice(index, 1);
    restaurado.eliminado = false;
    this.estudiantes.push(restaurado);
    this.mostrarToast(`${restaurado.nombre} ${restaurado.apellido} fue restaurado.`, 'exito');
  }

  /* ══════════════════════════════
     ELIMINAR PERMANENTE
  ══════════════════════════════ */

  eliminarPermanente(index: number): void {
    this.papelera.splice(index, 1);
    this.mostrarToast('Estudiante eliminado permanentemente.', 'error');
  }

  /* ══════════════════════════════
     VACIAR PAPELERA
  ══════════════════════════════ */

  vaciarPapelera(): void {
    this.papelera = [];
    this.mostrarToast('Papelera vaciada.', 'error');
  }

  /* ══════════════════════════════
     CAMBIAR VISTA
  ══════════════════════════════ */

  cambiarVista(vista: 'activos' | 'papelera'): void {
    this.vistaActual = vista;
  }

  /* ══════════════════════════════
     TOAST
  ══════════════════════════════ */

  private mostrarToast(mensaje: string, tipo: 'exito' | 'info' | 'error'): void {
    clearTimeout(this.toastTimer);
    this.toast = { mensaje, tipo };
    this.toastTimer = setTimeout(() => {
      this.toast = null;
    }, 3000);
  }

}
