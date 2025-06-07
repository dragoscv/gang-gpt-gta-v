/**
 * RAGE:MP Type Declarations
 * Basic type definitions for RAGE:MP server-side API
 */

declare global {
  namespace Mp {
    interface Player {
      id: number;
      name: string;
      ip: string;
      ping: number;
      health: number;
      armour: number;
      position: Vector3;
      heading: number;
      dimension: number;

      // Methods
      call(eventName: string, ...args: any[]): void;
      notify(message: string): void;
      spawn(position: Vector3): void;
      kick(reason?: string): void;
      ban(reason?: string): void;
      outputChatBox(message: string): void;
      giveWeapon(weapon: number, ammo: number): void;
      removeWeapon(weapon: number): void;
      setModel(model: number): void;
      playAnimation(
        dict: string,
        name: string,
        speed: number,
        flags: number
      ): void;
    }

    interface Vehicle {
      id: number;
      model: number;
      position: Vector3;
      heading: number;
      dimension: number;
      engine: boolean;
      locked: boolean;

      // Methods
      destroy(): void;
      repair(): void;
      setColor(color1: number, color2: number): void;
      setMod(modType: number, modIndex: number): void;
    }

    interface Vector3 {
      x: number;
      y: number;
      z: number;
    }

    interface Players {
      [id: number]: Player;
      length: number;

      forEach(callback: (player: Player) => void): void;
      at(index: number): Player | undefined;
      exists(player: Player): boolean;
    }

    interface Vehicles {
      [id: number]: Vehicle;
      length: number;

      forEach(callback: (vehicle: Vehicle) => void): void;
      at(index: number): Vehicle | undefined;
      exists(vehicle: Vehicle): boolean;
    }

    interface Events {
      add(eventName: string, callback: (...args: any[]) => void): void;
      remove(eventName: string, callback?: (...args: any[]) => void): void;
      call(eventName: string, ...args: any[]): void;
      callRemote(player: Player, eventName: string, ...args: any[]): void;
    }

    interface World {
      time: {
        hour: number;
        minute: number;
        set(hour: number, minute: number): void;
      };
      weather: string;
      setWeather(weather: string): void;
      setTime(hour: number, minute: number): void;
    }
  }

  // Global RAGE:MP objects
  const mp: {
    players: Mp.Players;
    vehicles: Mp.Vehicles;
    events: Mp.Events;
    world: Mp.World;
    Vector3: new (x: number, y: number, z: number) => Mp.Vector3;
  };
}

export {};
