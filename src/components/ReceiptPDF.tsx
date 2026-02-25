import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    backgroundColor: "#ffffff",
    color: "#000000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: "column",
  },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  logoPlaceholder: {
    width: 32,
    height: 32,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    marginRight: 10,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 700,
    color: "#000000",
  },
  companyDetails: {
    fontSize: 9,
    color: "#4b5563",
    lineHeight: 1.5,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  receiptTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#000000",
    marginBottom: 4,
  },
  receiptNumber: {
    fontSize: 12,
    color: "#4b5563",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 10,
    fontWeight: 600,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  badgePaid: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
  },
  badgeTest: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#000000",
    marginBottom: 16,
    marginTop: 24,
  },
  grid2: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  gridItem: {
    width: "48%",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingVertical: 4,
  },
  infoLabel: {
    color: "#4b5563",
    fontSize: 10,
  },
  infoValue: {
    color: "#000000",
    fontSize: 10,
    fontWeight: 500,
  },
  table: {
    marginTop: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#eaeaea",
    borderRadius: 12,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 600,
    color: "#000000",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
    backgroundColor: "#ffffff",
  },
  tableCell: {
    fontSize: 10,
    color: "#000000",
  },
  totalsSection: {
    width: "40%",
    alignSelf: "flex-end",
    marginTop: 16,
    marginBottom: 32,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingVertical: 4,
  },
  totalRowBold: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: "#eaeaea",
  },
  totalLabel: {
    fontSize: 12,
    color: "#4b5563",
  },
  totalLabelBold: {
    fontSize: 14,
    fontWeight: 700,
    color: "#000000",
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 600,
    color: "#000000",
  },
  totalValueBold: {
    fontSize: 18,
    fontWeight: 700,
    color: "#000000",
  },
  footer: {
    marginTop: 48,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#eaeaea",
    fontSize: 9,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 1.6,
  },
  warningBadge: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 10,
    fontWeight: 600,
    marginBottom: 16,
    textAlign: "center",
  },
});

interface ReceiptData {
  companyName: string;

  supportEmail: string;
  companyAddress: string;
  receiptNumber: string;
  transactionId: string;
  paymentIntentId: string;
  date: Date;
  paymentMethod: string;
  currency: string;
  customerName: string;
  customerEmail: string;
  billingAddress?: string;
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    tax: number;
    total: number;
  }>;
  subtotal: number;
  taxTotal: number;
  discount?: number;
  total: number;
  isTestMode: boolean;
  vatId?: string;
  registrationNumber?: string;
}

export const ReceiptPDF: React.FC<{ data: ReceiptData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.companyRow}>
            <View style={styles.logoPlaceholder}>
              <Image src={`${process.env.NEXT_PUBLIC_URL}/logo-1.png`} />
            </View>
            <Text style={styles.companyName}>{data.companyName}</Text>
          </View>
          <Text style={styles.companyDetails}>{data.supportEmail}</Text>
          <Text style={styles.companyDetails}>{data.companyAddress}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.receiptTitle}>Receipt</Text>
          <Text style={styles.receiptNumber}>{data.receiptNumber}</Text>
        </View>
      </View>

      <View style={styles.grid2}>
        <View style={styles.gridItem}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={[styles.badge, styles.badgePaid]}>
              <Text>✓ Paid</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Transaction ID</Text>
            <Text style={styles.infoValue}>{data.transactionId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Intent</Text>
            <Text style={styles.infoValue}>{data.paymentIntentId}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>
              {data.date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Method</Text>
            <Text style={styles.infoValue}>{data.paymentMethod}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Currency</Text>
            <Text style={styles.infoValue}>{data.currency}</Text>
          </View>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{data.customerName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{data.customerEmail}</Text>
          </View>
          {data.billingAddress && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Billing Address</Text>
              <Text style={styles.infoValue}>{data.billingAddress}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Order Details Table */}
      <Text style={styles.sectionTitle}>Order Details</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: "30%" }]}>Item</Text>
          <Text style={[styles.tableHeaderCell, { width: "30%" }]}>
            Description
          </Text>
          <Text
            style={[
              styles.tableHeaderCell,
              { width: "10%", textAlign: "right" },
            ]}
          >
            Qty
          </Text>
          <Text
            style={[
              styles.tableHeaderCell,
              { width: "15%", textAlign: "right" },
            ]}
          >
            Unit Price
          </Text>
          <Text
            style={[
              styles.tableHeaderCell,
              { width: "15%", textAlign: "right" },
            ]}
          >
            Total
          </Text>
        </View>

        {data.items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: "30%" }]}>
              {item.name}
            </Text>
            <Text
              style={[styles.tableCell, { width: "30%", color: "#4b5563" }]}
            >
              {item.description || "-"}
            </Text>
            <Text
              style={[styles.tableCell, { width: "10%", textAlign: "right" }]}
            >
              {item.quantity}
            </Text>
            <Text
              style={[styles.tableCell, { width: "15%", textAlign: "right" }]}
            >
              {data.currency} {item.unitPrice.toFixed(2)}
            </Text>
            <Text
              style={[styles.tableCell, { width: "15%", textAlign: "right" }]}
            >
              {data.currency} {item.total.toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>
            {data.currency} {data.subtotal.toFixed(2)}
          </Text>
        </View>

        {data.items.map(
          (item, index) =>
            item.tax > 0 && (
              <View key={`tax-${index}`} style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax ({item.name})</Text>
                <Text style={styles.totalValue}>
                  {data.currency} {item.tax.toFixed(2)}
                </Text>
              </View>
            ),
        )}

        {data.discount && data.discount > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Discount</Text>
            <Text style={styles.totalValue}>
              -{data.currency} {data.discount.toFixed(2)}
            </Text>
          </View>
        )}

        <View style={styles.totalRowBold}>
          <Text style={styles.totalLabelBold}>Total</Text>
          <Text style={styles.totalValueBold}>
            {data.currency} {data.total.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>This receipt was automatically generated.</Text>
        <Text> </Text>
        {data.registrationNumber && (
          <Text>Registration No: {data.registrationNumber}</Text>
        )}
        {data.vatId && <Text>VAT ID: {data.vatId}</Text>}
        <Text> </Text>
        <Text>Thank you for your business!</Text>
        {data.isTestMode && (
          <View style={styles.warningBadge}>
            <Text>⚠️ Test Payment – Not a real transaction</Text>
          </View>
        )}
      </View>
    </Page>
  </Document>
);
