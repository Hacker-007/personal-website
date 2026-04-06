declare namespace App {
  interface Locals {
    abuseToken: import('./src/server/abuse').AbuseToken | null
  }
}
