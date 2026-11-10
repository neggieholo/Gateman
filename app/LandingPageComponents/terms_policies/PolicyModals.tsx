import ModalShell, { PolicyModalProps } from "./PoliciesModalShell";

export default function TermsModal({ isOpen, onClose }: PolicyModalProps) {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Terms & Conditions">
      <div className="border-b border-slate-200 pb-4 mb-4">
        <p className="text-xs text-slate-500">Last updated: 2 November 2026</p>
        <p className="text-xs text-slate-500">
          GateMan Global Limited (RC No. 9269153)
        </p>
      </div>

      {/* 1. About these terms */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          1. About these terms
        </h3>
        <p>
          These Terms and Conditions (&quot;Terms&quot;) govern your use of the
          GateMan platform, website (gatemanhq.com), and related services
          (together, the &quot;Service&quot;), provided by GateMan Global
          Limited, a company registered in Nigeria (RC No. 9269153), with its
          head office at 37 Ajayi Street, off Upper Mission Road, Benin City,
          Edo State, Nigeria (&quot;GateMan&quot;, &quot;we&quot;,
          &quot;us&quot;, &quot;our&quot;).
        </p>
        <p>
          By creating an account, signing in, or using the Service, you agree to
          these Terms. If you are accepting on behalf of an estate, company, or
          other organisation, you confirm that you have authority to bind it.
        </p>
      </section>

      {/* 2. What GateMan provides */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          2. What GateMan provides
        </h3>
        <p>
          GateMan is a cloud-based property access management and security
          operations technology platform. It includes visitor management,
          resident and tenant management, security operations tools (such as
          guard scheduling, attendance, digital occurrence book, and incident
          reports), facility bookings, service requests, community messaging,
          and payment collection tools.
        </p>
        <p>
          GateMan provides software only. We do not provide security guards or
          security personnel. Security personnel who use the Service are
          supplied, employed, and managed by the property owner, the estate, or
          an independent security company. We are not responsible for their
          conduct, training, or performance.
        </p>
      </section>

      {/* 3. Accounts and user roles */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          3. Accounts and user roles
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Customers:</strong> Estates, residential communities,
            commercial properties, facility operators, and property managers
            that subscribe to the Service.
          </li>
          <li>
            <strong>Administrators:</strong> Manage a property&apos;s workspace
            and invite or approve other users.
          </li>
          <li>
            <strong>Residents, tenants, and staff:</strong> Use the Service
            under their property&apos;s workspace.
          </li>
          <li>
            <strong>Security personnel:</strong> Use the Service to record
            access, duties, and incidents.
          </li>
          <li>
            <strong>Visitors:</strong> People whose details are recorded by a
            resident or security personnel when they enter a property.
          </li>
        </ul>
        <p>
          You must provide accurate information, keep your login details
          confidential, and tell us promptly if you suspect unauthorised access.
          You are responsible for activity carried out through your account.
        </p>
      </section>

      {/* 4. Customer responsibilities */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          4. Customer responsibilities
        </h3>
        <p>Each Customer is responsible for:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>The accuracy of the information entered into its workspace;</li>
          <li>
            Making sure it has a lawful basis to collect and use the personal
            data of its residents, staff, guards, and visitors, and informing
            those people that their data is recorded through GateMan;
          </li>
          <li>
            The supervision, vetting, and conduct of its security personnel and
            contractors;
          </li>
          <li>
            Deciding who is granted or refused access to its property. GateMan
            records and communicates access decisions but does not make them.
          </li>
        </ul>
      </section>

      {/* 5. Fees and payments */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          5. Fees and payments
        </h3>
        <p>
          <strong>Subscription fees.</strong> Customers pay fees for the Service
          as set out in their order, quotation, or on our website. Fees are in
          Nigerian Naira (NGN) and are charged monthly, quarterly, or annually
          in advance unless agreed otherwise. Fees exclude applicable taxes such
          as VAT, which are added where required.
        </p>
        <p>
          <strong>Payment processing.</strong> Online payments are processed by
          Paystack, a third-party payment processor. We do not store your full
          card details. Your use of Paystack is also subject to Paystack&apos;s
          own terms and privacy policy.
        </p>
        <p>
          <strong>Payments made through the platform.</strong> The Service lets
          Customers collect payments from residents and users, such as estate
          dues, service charges, facility bookings, and event fees. In these
          cases the Customer, not GateMan, is the seller of the underlying
          service. GateMan provides the technology that collects and records the
          payment. The Customer is responsible for what the payment is for, and
          for refunds and disputes relating to it (see our Refund and
          Cancellation Policy).
        </p>
        <p>
          <strong>Failed payments.</strong> If a payment fails, we may retry it,
          notify you, and suspend access after 7 days of non-payment.
        </p>
        <p>
          <strong>Price changes.</strong> We may change our fees by giving at
          least 30 days&apos; notice. Changes apply from your next billing
          period.
        </p>
      </section>

      {/* 6. Acceptable use */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          6. Acceptable use
        </h3>
        <p>You must not:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Use the Service for any unlawful, fraudulent, or harmful purpose;
          </li>
          <li>
            Enter personal data without a lawful basis, or use it to harass,
            discriminate against, or unlawfully track any person;
          </li>
          <li>
            Attempt to access another Customer&apos;s workspace or data, or
            interfere with the security or operation of the Service;
          </li>
          <li>
            Copy, resell, reverse engineer, or create derivative works from the
            Service, except as the law allows;
          </li>
          <li>
            Upload malicious code or content that is unlawful, defamatory, or
            infringes others&apos; rights.
          </li>
        </ul>
      </section>

      {/* 7. Privacy and data */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          7. Privacy and data
        </h3>
        <p>
          Our Privacy Policy explains how personal data is collected and used.
          For data entered into a Customer&apos;s workspace, the Customer is the
          data controller and GateMan acts as its data processor. The Customer
          is responsible for responding to requests from the people whose data
          it holds, and we will assist as required by law.
        </p>
      </section>

      {/* 8. Availability and support */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          8. Availability and support
        </h3>
        <p>
          We aim to keep the Service available, but we do not guarantee
          uninterrupted or error-free operation. Planned maintenance, internet
          or power outages, third-party provider failures, and events outside
          our control may affect availability. Support is available Monday to
          Friday, 8:00am to 5:00pm WAT via support@gatemanhq.com.
        </p>
      </section>

      {/* 9. Intellectual property */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          9. Intellectual property
        </h3>
        <p>
          GateMan owns the Service, including its software, design, logos, and
          content. We grant you a limited, non-exclusive, non-transferable right
          to use the Service during your subscription. Customers keep ownership
          of the data they enter, and grant us the right to host and process it
          to provide the Service.
        </p>
      </section>

      {/* 10. Suspension and termination */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          10. Suspension and termination
        </h3>
        <p>
          We may suspend or end access if you breach these Terms, fail to pay,
          or use the Service in a way that risks harm to others or to the
          Service. You may stop using the Service and cancel at any time as set
          out in our Refund and Cancellation Policy.
        </p>
      </section>

      {/* 11. Disclaimers and limitation of liability */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          11. Disclaimers and limitation of liability
        </h3>
        <p>
          GateMan is a management and record-keeping tool. We do not guarantee
          that using the Service will prevent theft, intrusion, injury, loss, or
          any other security incident, and we are not liable for the actions or
          omissions of security personnel, visitors, residents, or other third
          parties.
        </p>
        <p>
          To the fullest extent permitted by law, GateMan is not liable for
          indirect or consequential loss, loss of profit, or loss of data. Our
          total liability for any claim relating to the Service is limited to
          the fees you paid to us in the 12 months before the claim arose.
          Nothing in these Terms excludes liability that cannot be excluded by
          law.
        </p>
      </section>

      {/* 12. Indemnity */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          12. Indemnity
        </h3>
        <p>
          You agree to cover GateMan against claims, losses, and costs arising
          from your breach of these Terms, your unlawful use of the Service, or
          your failure to meet your data protection obligations to the people
          whose data you enter.
        </p>
      </section>

      {/* 13. Changes to these Terms */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          13. Changes to these Terms
        </h3>
        <p>
          We may update these Terms from time to time. We will post the updated
          version on our website and update the date above. If a change is
          material, we will notify Customers by email or in the platform.
          Continued use after the change means you accept it.
        </p>
      </section>

      {/* 14. Governing law and disputes */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          14. Governing law and disputes
        </h3>
        <p>
          These Terms are governed by the laws of the Federal Republic of
          Nigeria. We will try to resolve any dispute through good-faith
          discussion first. If that fails, the courts of Edo State, Nigeria have
          jurisdiction.
        </p>
      </section>

      {/* 15. Contact us */}
      <section className="space-y-2 pt-2 border-t border-slate-100">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          15. Contact us
        </h3>
        <p>
          GateMan Global Limited, 37 Ajayi Street, off Upper Mission Road, Benin
          City, Edo State, Nigeria. Email: support@gatemanhq.com.
        </p>
      </section>
    </ModalShell>
  );
}

export function PrivacyModal({ isOpen, onClose }: PolicyModalProps) {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Privacy Policy">
      <div className="border-b border-slate-200 pb-4 mb-4">
        <p className="text-xs text-slate-500">Last updated: 2 November 2026</p>
        <p className="text-xs text-slate-500">
          GateMan Global Limited (RC No. 9269153)
        </p>
      </div>

      {/* 1. Introduction */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          1. Introduction
        </h3>
        <p>
          GateMan Global Limited (RC No. 9269153) (&quot;GateMan&quot;,
          &quot;we&quot;, &quot;us&quot;) respects your privacy. This policy
          explains what personal data we collect, how we use it, who we share it
          with, and your rights under the Nigeria Data Protection Act 2023
          (NDPA) and other applicable laws.
        </p>
      </section>

      {/* 2. Our role: controller and processor */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          2. Our role: controller and processor
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>As controller,</strong> we decide how and why we use
            personal data of website visitors, people who enquire about the
            Service, and the administrators of our Customers&apos; accounts.
          </li>
          <li>
            <strong>As processor,</strong> we process the personal data of
            residents, tenants, staff, security personnel, and visitors on
            behalf of our Customers (estates, property managers, and
            businesses), who act as the controllers. They decide what is
            collected and why. If you want to exercise your rights over that
            data, please contact the estate or property that holds it. We will
            help them respond.
          </li>
        </ul>
      </section>

      {/* 3. Information we collect */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          3. Information we collect
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Account and contact information:</strong> name, email
            address, phone number, property or organisation name, role, and
            login credentials.
          </li>
          <li>
            <strong>Resident and household information:</strong> profiles, unit
            or house number, household members, guest approvals, and access
            permissions.
          </li>
          <li>
            <strong>Visitor and access information:</strong> visitor name, phone
            number, purpose of visit, host, vehicle details, QR codes or
            one-time PINs, and check-in and check-out times.
          </li>
          <li>
            <strong>Security operations information:</strong> guard schedules,
            attendance, duty assignments, occurrence book entries, incident
            reports, shift handovers, and audit logs. Where enabled by a
            Customer, we also collect location data and liveness-verified photos
            from security personnel to confirm presence at an assigned duty
            point.
          </li>
          <li>
            <strong>Community and communications:</strong> posts, comments,
            direct messages, broadcasts, bookings, and service requests made
            through the platform.
          </li>
          <li>
            <strong>Payment information:</strong> payment amounts, references,
            status, and the name or email associated with a payment. Card and
            bank details are collected and processed by Paystack. We do not
            store full card numbers.
          </li>
          <li>
            <strong>Technical information:</strong> device type, IP address,
            browser, and usage logs, collected through the website and app.
          </li>
        </ul>
      </section>

      {/* 4. How we use personal data and our lawful bases */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          4. How we use personal data and our lawful bases
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            To provide and operate the Service, including access control,
            visitor records, security operations, and bookings (performance of a
            contract).
          </li>
          <li>
            To process payments and keep payment records (contract and legal
            obligation).
          </li>
          <li>
            To keep the platform secure, prevent fraud and abuse, and maintain
            audit trails (legitimate interests).
          </li>
          <li>
            To provide support and communicate with you about the Service
            (contract and legitimate interests).
          </li>
          <li>
            To improve the Service and understand usage (legitimate interests).
          </li>
          <li>
            To comply with the law and respond to lawful requests from
            authorities (legal obligation).
          </li>
          <li>
            Where required, based on your consent, which you may withdraw at any
            time. We do not sell personal data.
          </li>
        </ul>
      </section>

      {/* 5. Who we share data with */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          5. Who we share data with
        </h3>
        <p>We share personal data only as needed to run the Service:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            The Customer whose workspace the data belongs to, including its
            administrators and authorised security personnel;
          </li>
          <li>Paystack, to process payments;</li>
          <li>
            Service providers such as cloud hosting, SMS, email, and analytics
            providers, under written agreements requiring them to protect the
            data;
          </li>
          <li>
            Authorities or regulators, where required by law or to protect
            rights and safety;
          </li>
          <li>
            Successors, in connection with a merger, acquisition, or sale of the
            business, subject to this policy.
          </li>
        </ul>
      </section>

      {/* 6. International transfers */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          6. International transfers
        </h3>
        <p>
          Some providers may store or process data outside Nigeria. Where this
          happens, we take steps to make sure the data is protected to a
          standard consistent with the NDPA, such as appropriate contractual
          safeguards.
        </p>
      </section>

      {/* 7. How long we keep data */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          7. How long we keep data
        </h3>
        <p>
          We keep personal data only as long as needed for the purposes above.
          Unless a Customer or the law requires otherwise, visitor and access
          logs are kept for 24 months, and account data is kept while the
          account is active. After an account ends, we keep data for 30 days so
          it can be exported, then delete or anonymise it, except where we must
          retain it for legal, tax, or dispute purposes.
        </p>
      </section>

      {/* 8. Security */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          8. Security
        </h3>
        <p>
          We use measures such as encrypted connections, access controls,
          role-based permissions, and audit logs to protect data. No system is
          completely secure, so we cannot guarantee absolute security. If a
          breach affecting your data occurs, we will notify the Nigeria Data
          Protection Commission and affected individuals as the law requires.
        </p>
      </section>

      {/* 9. Your rights */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          9. Your rights
        </h3>
        <p>Under the NDPA, you have the right to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>be informed about how your data is used;</li>
          <li>access your personal data and receive a copy;</li>
          <li>correct inaccurate or incomplete data;</li>
          <li>request deletion of your data in certain circumstances;</li>
          <li>
            restrict or object to certain processing, including direct
            marketing;
          </li>
          <li>withdraw consent where we rely on it;</li>
          <li>receive your data in a portable format where applicable;</li>
          <li>
            lodge a complaint with the Nigeria Data Protection Commission.
          </li>
        </ul>
        <p>
          To exercise these rights over data we hold as controller, contact us
          at privacy@gatemanhq.com. We aim to respond within 30 days. For data
          held by an estate or property, please contact that organisation
          directly.
        </p>
      </section>

      {/* 10. Children */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          10. Children
        </h3>
        <p>
          The Service is not directed at children. Where a Customer records the
          details of a minor (for example, as a household member), the Customer
          is responsible for having the appropriate consent from a parent or
          guardian.
        </p>
      </section>

      {/* 11. Cookies */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          11. Cookies
        </h3>
        <p>
          Our website uses essential cookies and similar technologies to
          function and to understand how it is used. You can control cookies
          through your browser settings.
        </p>
      </section>

      {/* 12. Changes to this policy */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          12. Changes to this policy
        </h3>
        <p>
          We may update this policy from time to time. The latest version will
          always be on our website, with the date updated above.
        </p>
      </section>

      {/* 13. Contact us */}
      <section className="space-y-2 pt-2 border-t border-slate-100">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          13. Contact us
        </h3>
        <p>
          GateMan Global Limited, 37 Ajayi Street, off Upper Mission Road, Benin
          City, Edo State, Nigeria. Email: privacy@gatemanhq.com.
        </p>
      </section>
    </ModalShell>
  );
}

export function RefundModal({ isOpen, onClose }: PolicyModalProps) {
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Refund and Cancellation Policy"
    >
      <div className="border-b border-slate-200 pb-4 mb-4">
        <p className="text-xs text-slate-500">Last updated: 2 November 2026</p>
        <p className="text-xs text-slate-500">
          GateMan Global Limited (RC No. 9269153)
        </p>
      </div>

      {/* 1. Overview */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          1. Overview
        </h3>
        <p>
          This policy explains how cancellations and refunds work for payments
          made through GateMan. There are two types of payment, and they are
          handled differently:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Platform fees,</strong> which a Customer (estate, property
            manager, or business) pays to GateMan to use the Service.
          </li>
          <li>
            <strong>Payments made through the platform,</strong> which residents
            or users pay to their estate or property, such as dues, service
            charges, facility bookings, and event fees.
          </li>
        </ul>
      </section>

      {/* 2. Platform fees: cancellation */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          2. Platform fees: cancellation
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            You may cancel your subscription at any time by emailing{" "}
            <code>support@gatemanhq.com</code> or from your account settings (if
            available).
          </li>
          <li>
            Please give at least 30 days&apos; written notice. Cancellation
            takes effect at the end of the current billing period.
          </li>
          <li>
            You keep access to the Service until the end of the period you have
            paid for.
          </li>
          <li>
            Cancelling stops future charges. It does not cancel any amount
            already due.
          </li>
        </ul>
      </section>

      {/* 3. Platform fees: refunds */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          3. Platform fees: refunds
        </h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>First-payment refund.</strong> If you are not satisfied, you
            may request a full refund of your first subscription payment within
            7 days of that payment.
          </li>
          <li>
            After that period, fees are non-refundable, including for unused or
            partial billing periods, except where required by law or where we
            have failed to deliver the Service as agreed.
          </li>
          <li>
            Setup, onboarding, and hardware fees, if any, are non-refundable
            once the work has started or the items have been delivered.
          </li>
          <li>
            Duplicate or incorrect charges will be refunded in full once
            verified.
          </li>
        </ul>
      </section>

      {/* 4. Payments made through the platform */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          4. Payments made through the platform
        </h3>
        <p>
          When a resident or user pays their estate through GateMan, the estate
          is responsible for the service or charge being paid for. As a result:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Refund eligibility is decided by the estate or property, in line
            with its own rules. For example, a facility booking may be
            refundable if cancelled a set time before the event.
          </li>
          <li>
            Requests should go to the estate administrator first. If you cannot
            reach them, contact <code>support@gatemanhq.com</code> and we will
            pass the request on.
          </li>
          <li>
            Once an estate approves a refund, GateMan will initiate it through
            Paystack to the original payment method.
          </li>
          <li>
            Duplicate payments, failed transactions where money was debited, and
            payments made in error will be investigated and, where confirmed,
            reversed.
          </li>
        </ul>
      </section>

      {/* 5. How to request a refund */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          5. How to request a refund
        </h3>
        <p>
          Email <code>support@gatemanhq.com</code> with:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>your name and the property or organisation name;</li>
          <li>the payment reference, date, and amount;</li>
          <li>the reason for your request.</li>
        </ul>
        <p>We will acknowledge your request within 2 business days.</p>
      </section>

      {/* 6. Refund timing */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          6. Refund timing
        </h3>
        <p>
          Approved refunds are processed within 5 business days and returned to
          the original payment method. After that, your bank or card issuer may
          take a further 5 to 10 business days to show the money in your
          account.
        </p>
      </section>

      {/* 7. Chargebacks and disputes */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          7. Chargebacks and disputes
        </h3>
        <p>
          If you have a problem with a payment, please contact us first so we
          can resolve it quickly. If a chargeback is filed, we may share
          relevant transaction records with Paystack and the card issuer to
          respond.
        </p>
      </section>

      {/* 8. Your data after cancellation */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          8. Your data after cancellation
        </h3>
        <p>
          When a subscription ends, the Customer can export its data for 30
          days. After that, we delete or anonymise it as described in our
          Privacy Policy, except where we must retain records by law.
        </p>
      </section>

      {/* 9. Changes to this policy */}
      <section className="space-y-2">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          9. Changes to this policy
        </h3>
        <p>
          We may update this policy from time to time. Changes do not affect
          payments already made. The latest version will always be on our
          website.
        </p>
      </section>

      {/* 10. Contact us */}
      <section className="space-y-2 pt-2 border-t border-slate-100">
        <h3 className="text-base font-bold text-gm-navy font-montserrat">
          10. Contact us
        </h3>
        <p>
          GateMan Global Limited, 37 Ajayi Street, off Upper Mission Road, Benin
          City, Edo State, Nigeria. Email: support@gatemanhq.com.
        </p>
      </section>
    </ModalShell>
  );
}
